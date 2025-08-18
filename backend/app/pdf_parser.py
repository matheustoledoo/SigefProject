import pdfplumber
import re
from .models import Certificate, Point
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# padrões dos campos
FIELD_PATTERNS = {
    "denominacao": r"Denominação:\s*(.+)",
    "proprietario": r"Proprietário\(a\):\s*(.+)",
    "matricula_imovel": r"Matrícula do imóvel:\s*(.+)",
    "natureza_area": r"Natureza da Área:\s*(.+)",
    "cnpj": r"CNPJ:\s*(.+)",
    "municipio_uf": r"Município/UF:\s*(.+)",
    "codigo_incra": r"Código INCRA/SNCR:\s*(.+)",
    "responsavel_tecnico": r"Responsável Técnico\(a\):\s*(.+)",
    "formacao": r"Formação:\s*(.+)",
    "codigo_credenciamento": r"Código de credenciamento:\s*(.+)",
    "sistema_geodesico": r"Sistema Geodésico de referência:\s*(.+)",
    "documento_rt": r"Documento de RT:\s*(.+)",
    "area_local": r"Área \(Sistema Geodésico Local\):\s*(.+)",
    "perimetro": r"Perímetro \(m\):\s*(.+)",
    "azimutes": r"Azimutes:\s*(.+)",
}

CERTIFICATION_ID_RE = re.compile(r"CERTIFICAÇÃO:\s*([0-9a-fA-F\-]+)")
POINT_CODE_RE = re.compile(r"(D5Y-[MPV])-(\d{4,})")  # ex: D5Y-M-0001

async def parse_pdf_and_store(file_path: str, filename: str, db: AsyncSession):
    from .models import PDFUpload, Certificate

    pdf_upload = PDFUpload(filename=filename)
    db.add(pdf_upload)
    await db.flush()

    full_text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            txt = page.extract_text() or ""
            full_text += txt + "\n"

    certification_ids = CERTIFICATION_ID_RE.findall(full_text)
    if not certification_ids:
        raise ValueError("Nenhuma certificação encontrada no PDF.")

    # dividimos por "CERTIFICAÇÃO: ..." mantendo os marcadores
    parts = re.split(r"(CERTIFICAÇÃO:\s*[0-9a-fA-F\-]+)", full_text)
    # Estrutura: [segmento0 (antes de qualquer certificação), marker1, segmento1, marker2, segmento2, ...]
    # Para cada marker (índices ímpares), o bloco relevante que contém os pontos e campos está EM SEU ANTECESSOR (parts[i-1])
    for i in range(1, len(parts), 2):
        marker = parts[i]
        block = parts[i - 1] if i - 1 >= 0 else ""
        # existe também o texto depois do marker com a parte final da certificação (datas), mas os pontos estão antes
        # vamos extrair ID
        m_id = CERTIFICATION_ID_RE.search(marker)
        if not m_id:
            continue
        cert_id = m_id.group(1).strip()

        try:
            # checa existência da certificação
            existing_stmt = select(Certificate).where(Certificate.certification_id == cert_id)
            result = await db.execute(existing_stmt)
            cert = result.scalar_one_or_none()

            def extract(pat):
                mm = re.search(pat, block)
                return mm.group(1).strip() if mm else None

            if cert:
                logger.info(f"[{cert_id}] já existe, atualizando pontos.")
            else:
                cert = Certificate(
                    certification_id=cert_id,
                    denominação=extract(FIELD_PATTERNS["denominacao"]),
                    proprietario=extract(FIELD_PATTERNS["proprietario"]),
                    matricula_imovel=extract(FIELD_PATTERNS["matricula_imovel"]),
                    natureza_area=extract(FIELD_PATTERNS["natureza_area"]),
                    cnpj=extract(FIELD_PATTERNS["cnpj"]),
                    municipio_uf=extract(FIELD_PATTERNS["municipio_uf"]),
                    codigo_incra=extract(FIELD_PATTERNS["codigo_incra"]),
                    responsavel_tecnico=extract(FIELD_PATTERNS["responsavel_tecnico"]),
                    formacao=extract(FIELD_PATTERNS["formacao"]),
                    codigo_credenciamento=extract(FIELD_PATTERNS["codigo_credenciamento"]),
                    sistema_geodesico=extract(FIELD_PATTERNS["sistema_geodesico"]),
                    documento_rt=extract(FIELD_PATTERNS["documento_rt"]),
                    area_local=extract(FIELD_PATTERNS["area_local"]),
                    perimetro=extract(FIELD_PATTERNS["perimetro"]),
                    azimutes=extract(FIELD_PATTERNS["azimutes"]),
                    pdf_id=pdf_upload.id,
                )
                # datas aparecem após o marker, então concatena esse trecho para buscar datas
                after_marker_block = parts[i + 1] if i + 1 < len(parts) else ""
                match_cert_date = re.search(r"Data Certificação:\s*([\d/]+\s*[\d:]+)", after_marker_block)
                match_gen_date = re.search(r"Data da Geração:\s*([\d/]+\s*[\d:]+)", after_marker_block)
                if match_cert_date:
                    cert.data_certificacao = match_cert_date.group(1).strip()
                if match_gen_date:
                    cert.data_geracao = match_gen_date.group(1).strip()

                db.add(cert)
                await db.flush()
                logger.info(f"[{cert_id}] nova certificação criada.")

            # extrai pontos do bloco anterior (onde aparecem)
            novos_pontos = []
            for m in POINT_CODE_RE.finditer(block):
                prefix = m.group(1)
                number_str = m.group(2)
                try:
                    number = int(number_str)
                except:
                    continue
                full_code = f"{prefix}-{number_str}"
                # evita duplicação
                existing_point_stmt = select(Point).where(Point.code == full_code)
                existing_point = (await db.execute(existing_point_stmt)).scalar_one_or_none()
                if existing_point:
                    continue
                point = Point(code=full_code, prefix=prefix, number=number, certificate_id=cert.id, certificate_certification_id=cert.certification_id,)
                db.add(point)
                novos_pontos.append(full_code)

            if novos_pontos:
                logger.info(f"[{cert_id}] pontos adicionados: {novos_pontos}")
            else:
                logger.info(f"[{cert_id}] nenhum ponto novo encontrado.")

        except Exception as e:
            logger.error(f"Erro ao processar certificação {cert_id}: {e}")
            continue

    await db.commit()
