from __future__ import annotations

from fastapi import APIRouter

from .. import dependency_model, sensitivity, zone_clustering
from ..schemas import DependencyModelOut, SensitivityOut, ZoneClustersOut

router = APIRouter(prefix="/api/ml", tags=["ml"])


@router.get("/zone-clusters", response_model=ZoneClustersOut)
def get_zone_clusters() -> ZoneClustersOut:
    return ZoneClustersOut(**zone_clustering.compute_zone_clusters())


@router.get("/dependency-model", response_model=DependencyModelOut)
def get_dependency_model() -> DependencyModelOut:
    return DependencyModelOut(**dependency_model.compute_dependency_model())


@router.get("/sensitivity", response_model=SensitivityOut)
def get_sensitivity() -> SensitivityOut:
    return SensitivityOut(**sensitivity.compute_sensitivity())
