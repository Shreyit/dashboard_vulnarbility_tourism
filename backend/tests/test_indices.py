from app import indices


def test_town_tvi_in_range():
    result = indices.compute_tvi(zone_id=None)
    assert result["tvi"] is not None
    assert 0 <= result["tvi"] <= 100


def test_sub_index_scores_bounded_0_1():
    for theme in indices.THEME_COMPONENTS:
        score, _ = indices.compute_subindex(theme, None)
        if score is not None:
            assert 0 <= score <= 1, f"{theme} score {score} out of [0,1]"


def test_every_zone_has_a_tvi():
    for z in indices.list_zones():
        result = indices.compute_tvi(z["zone_id"])
        assert result["tvi"] is not None
        assert 0 <= result["tvi"] <= 100


def test_zone_value_falls_back_to_town_wide_proxy():
    # Tourist survey isn't GPS-tagged at all, so any tourist-only column must
    # fall back to the town-wide value with is_proxy=True for every zone.
    zones = indices.list_zones()
    assert zones, "expected at least one zone"
    value, is_proxy = indices.value_for("tourist", "overall_satisfaction", zones[0]["zone_id"])
    assert is_proxy is True
    assert value == indices.town_value("tourist", "overall_satisfaction")


def test_zone_display_name_is_stable_and_readable():
    assert indices.zone_display_name("Z07") == "Site 7"
    assert indices.zone_display_name("Z01") == "Site 1"
