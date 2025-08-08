# backend/app/schemas.py

from pydantic import BaseModel
from typing import List, Optional

class PointBase(BaseModel):
    code: str
    prefix: str
    number: int

class PointOut(PointBase):
    certificate_certification_id: str

    class Config:
        orm_mode = True

class CertificateBase(BaseModel):
    certification_id: str

class CertificateSummary(BaseModel):
    certification_id: str
    denominação: Optional[str] = None
    proprietario: Optional[str] = None

    class Config:
        orm_mode = True

class CertificateOut(BaseModel):
    certification_id: str
    denominação: Optional[str]
    proprietario: Optional[str]
    matricula_imovel: Optional[str]
    natureza_area: Optional[str]
    cnpj: Optional[str]
    municipio_uf: Optional[str]
    codigo_incra: Optional[str]
    responsavel_tecnico: Optional[str]
    formacao: Optional[str]
    codigo_credenciamento: Optional[str]
    sistema_geodesico: Optional[str]
    documento_rt: Optional[str]
    area_local: Optional[str]
    perimetro: Optional[str]
    azimutes: Optional[str]
    data_certificacao: Optional[str]
    data_geracao: Optional[str]
    points: List[PointOut] = []

    class Config:
        orm_mode = True
