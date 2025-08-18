import os
import logging
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from .database import get_session
from .models import Certificate, Point
from .pdf_parser import parse_pdf_and_store
from .schemas import CertificateSummary
from . import crud

logging.basicConfig(level=logging.INFO)
router = APIRouter()


@router.post("/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
):
    """
    Recebe PDF, parseia e armazena certificados e pontos.
    Retorna mensagem de sucesso e total de certificados.
    """
    from tempfile import NamedTemporaryFile

    # salva o PDF em arquivo temporário
    with NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        contents = await file.read()
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        await parse_pdf_and_store(tmp_path, file.filename, session)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro no parser: {e}")
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            pass

    # busca total de certificados
    result = await session.execute(select(func.count(Certificate.id)))
    total = result.scalar_one()
    return {"message": "PDF processado", "total_certificados": total}


@router.get("/stats")
async def stats(session: AsyncSession = Depends(get_session)):
    """
    Retorna { total_certificados: int }
    """
    result = await session.execute(select(func.count(Certificate.id)))
    total = result.scalar_one()
    return {"total_certificados": total}


@router.get("/search/point/{raw_code}")
async def search_point(
    raw_code: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Busca um ponto por código e retorna JSON com:
      { point: {...}, certificate: {...} }
    """
    code = raw_code.strip().upper().replace("–", "-").replace("—", "-")
    logging.info(f"[search_point] recebido {raw_code!r} → normalizado: {code!r}")

    stmt = (
        select(Point)
        .options(selectinload(Point.certificate))
        .where(func.lower(Point.code) == code.lower())
    )
    result = await session.execute(stmt)
    point = result.scalar_one_or_none()

    if not point:
        raise HTTPException(status_code=404, detail="Ponto não encontrado")

    cert = point.certificate
    return {
        "point": {
            "code": point.code,
            "prefix": point.prefix,
            "number": point.number,
            "certificate_certification_id": point.certificate_certification_id,
        },
        "certificate": {
            "certification_id": cert.certification_id,
            "denominação": getattr(cert, "denominacao", getattr(cert, "denominação", None)),
            "proprietario": cert.proprietario,
            "matricula_imovel": cert.matricula_imovel,
            "natureza_area": cert.natureza_area,
            "cnpj": cert.cnpj,
            "municipio_uf": cert.municipio_uf,
            "codigo_incra": cert.codigo_incra,
            "responsavel_tecnico": cert.responsavel_tecnico,
            "formacao": cert.formacao,
            "codigo_credenciamento": cert.codigo_credenciamento,
            "sistema_geodesico": cert.sistema_geodesico,
            "documento_rt": cert.documento_rt,
            "area_local": cert.area_local,
            "perimetro": cert.perimetro,
            "azimutes": cert.azimutes,
            "data_certificacao": cert.data_certificacao,
            "data_geracao": cert.data_geracao,
        },
    }


@router.get("/search/certification/{raw_id}")
async def search_certification(
    raw_id: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Busca uma certificação por ID e retorna JSON com:
      { certificate: {...}, points: [{code, prefix, number}, ...] }
    """
    cert_id = raw_id.strip()
    logging.info(f"[search_certification] recebido {raw_id!r} → normalizado: {cert_id!r}")

    # Tenta match exato primeiro
    stmt = (
        select(Certificate)
        .options(selectinload(Certificate.points))
        .where(Certificate.certification_id == cert_id)
    )
    result = await session.execute(stmt)
    cert = result.scalar_one_or_none()

    # Se não achar, tenta case-insensitive
    if not cert:
        stmt2 = (
            select(Certificate)
            .options(selectinload(Certificate.points))
            .where(func.lower(Certificate.certification_id) == cert_id.lower())
        )
        result2 = await session.execute(stmt2)
        cert = result2.scalar_one_or_none()

    if not cert:
        raise HTTPException(status_code=404, detail="Certificação não encontrada")

    # Monta lista de pontos
    points_list = [
        {"code": p.code, "prefix": p.prefix, "number": p.number}
        for p in cert.points
    ]

    return {
        "certificate": {
            "certification_id": cert.certification_id,
            "denominação": getattr(cert, "denominacao", getattr(cert, "denominação", None)),
            "proprietario": cert.proprietario,
            "matricula_imovel": cert.matricula_imovel,
            "natureza_area": cert.natureza_area,
            "cnpj": cert.cnpj,
            "municipio_uf": cert.municipio_uf,
            "codigo_incra": cert.codigo_incra,
            "responsavel_tecnico": cert.responsavel_tecnico,
            "formacao": cert.formacao,
            "codigo_credenciamento": cert.codigo_credenciamento,
            "sistema_geodesico": cert.sistema_geodesico,
            "documento_rt": cert.documento_rt,
            "area_local": cert.area_local,
            "perimetro": cert.perimetro,
            "azimutes": cert.azimutes,
            "data_certificacao": cert.data_certificacao,
            "data_geracao": cert.data_geracao,
        },
        "points": points_list,
    }


@router.get("/intervals/{prefix}")
async def get_intervals(prefix: str, session: AsyncSession = Depends(get_session)):
    """
    Gaps disponíveis para o prefixo.
    """
    if prefix not in ("D5Y-M", "D5Y-P", "D5Y-V"):
        raise HTTPException(status_code=400, detail="Prefixo inválido")

    pts = (await session.execute(select(Point).where(Point.prefix == prefix))).scalars().all()
    used_nums = sorted({int(p.number) for p in pts})

    # calcula gaps de 1..9999
    gaps = []
    prev = 0
    for n in used_nums:
        if n - prev > 1:
            gaps.append((prev + 1, n - 1))
        prev = n
    if prev < 9999:
        gaps.append((prev + 1, 9999))

    def fmt(a, b):
        return {"from": f"{prefix}-{a:04d}", "to": f"{prefix}-{b:04d}"}

    missing_intervals = [fmt(a, b) for a, b in gaps]
    current = fmt(*gaps[0]) if gaps else None
    nxt = fmt(*gaps[1]) if len(gaps) > 1 else None

    return {
        "missing_intervals": missing_intervals,
        "current_interval": current,
        "next_interval": nxt,
        "used_points": [f"{prefix}-{n:04d}" for n in used_nums],
    }
