# backend/app/schemas.py

from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

# Base comum com from_attributes habilitado (equivale ao antigo orm_mode=True)
class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class PointBase(ORMModel):
    code: str
    prefix: str
    number: int


class PointOut(PointBase):
    certificate_certification_id: str


class CertificateBase(ORMModel):
    certification_id: str


class CertificateSummary(ORMModel):
    certification_id: str
    denominação: Optional[str] = None
    proprietario: Optional[str] = None


class CertificateOut(ORMModel):
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
    points: List[PointOut] = Field(default_factory=list)
