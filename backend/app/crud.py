from sqlalchemy import select
from .models import Certificate, Point, PDFUpload
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

async def get_certificates_count(session: AsyncSession) -> int:
    result = await session.execute(select(Certificate))
    return len(result.scalars().all())

async def search_by_point_code(session: AsyncSession, code: str):
    stmt = select(Point).where(Point.code == code)
    result = await session.execute(stmt)
    point = result.scalar_one_or_none()
    return point

async def search_by_certification(session: AsyncSession, cert_id: str):
    stmt = select(Certificate).where(Certificate.certification_id == cert_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()

async def get_points_by_prefix(session: AsyncSession, prefix: str) -> List[Point]:
    stmt = select(Point).where(Point.prefix == prefix).order_by(Point.number)
    result = await session.execute(stmt)
    return result.scalars().all()

def compute_intervals(points_numbers: List[int]):
    if not points_numbers:
        return []
    sorted_nums = sorted(set(points_numbers))
    intervals = []
    start = sorted_nums[0]
    prev = start
    for n in sorted_nums[1:]:
        if n != prev + 1:
            intervals.append((start, prev))
            start = n
        prev = n
    intervals.append((start, prev))
    return intervals

def compute_missing_intervals(points_numbers: list[int]) -> list[tuple[int, int]]:
    if not points_numbers:
        # nenhum ponto usado, intervalo inicial é 1..N arbitrário (expansível no endpoint)
        return []

    sorted_nums = sorted(set(points_numbers))
    missing = []

    # gap inicial: de 1 até antes do primeiro usado
    if sorted_nums[0] > 1:
        missing.append((1, sorted_nums[0] - 1))

    # gaps internos
    for i in range(len(sorted_nums) - 1):
        curr = sorted_nums[i]
        nxt = sorted_nums[i + 1]
        if nxt > curr + 1:
            missing.append((curr + 1, nxt - 1))

    return missing


def format_code(prefix: str, number: int):
    return f"{prefix}-{str(number).zfill(4)}"