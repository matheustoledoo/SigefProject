from sqlalchemy import (
    Column,
    String,
    Integer,
    DateTime,
    ForeignKey,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import datetime
import uuid
from .database import Base


class PDFUpload(Base):
    __tablename__ = "pdf_uploads"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    certificates = relationship("Certificate", back_populates="pdf")

class Certificate(Base):
    __tablename__ = "certificates"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    certification_id = Column(String, index=True)  # ex: 4d7ca...
    denominação = Column(String)
    proprietario = Column(String)
    matricula_imovel = Column(String)
    natureza_area = Column(String)
    cnpj = Column(String)
    municipio_uf = Column(String)
    codigo_incra = Column(String)
    responsavel_tecnico = Column(String)
    formacao = Column(String)
    codigo_credenciamento = Column(String)
    sistema_geodesico = Column(String)
    documento_rt = Column(String)
    area_local = Column(String)
    perimetro = Column(String)
    azimutes = Column(String)
    data_certificacao = Column(String)
    data_geracao = Column(String)
    pdf_id = Column(UUID(as_uuid=True), ForeignKey("pdf_uploads.id"))
    pdf = relationship("PDFUpload", back_populates="certificates")
    points = relationship("Point", back_populates="certificate")

    __table_args__ = (UniqueConstraint("certification_id", name="uq_certification_id"),)

# backend/app/models.py


class Point(Base):
    __tablename__ = "points"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String, unique=True, index=True, nullable=False)
    prefix = Column(String, nullable=False)
    number = Column(Integer, nullable=False)        # <— aqui
    certificate_id = Column(UUID(as_uuid=True), ForeignKey("certificates.id"), nullable=False)
    certificate = relationship("Certificate", back_populates="points")

    __table_args__ = (
        UniqueConstraint("code", name="uq_point_code"),
    )

