"""Raw survey columns -> derived 0-1 variables (VARIABLES_AND_DATA_SOURCES.md SS3).

Each `derive_*` function takes one processed/*.csv DataFrame and returns a new
DataFrame of derived, direction-aligned (1 = more stressed/pressured/precarious,
0 = the opposite -- workflow.md SS5 step 3) columns, one row per respondent (or per
zone for Location), keeping `zone_id` where the source survey carries one.

A documented composite input that has no usable source column in the actual data
(e.g. `worker_paid_on_time` -- the question doesn't exist in the cleaned Workers
table) is simply omitted here; `indices.py` averages over whatever components are
present rather than failing.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from .colfind import find_col
from .mapping import (
    ENV_TREND_MAP,
    INCOME_SHARE_BUCKET_MAP,
    NOISE_CATEGORY_MAP,
    PRICE_INFLATION_MAP,
    SEWAGE_ADEQUACY_MAP,
    WATER_CONSTRAINT_MAP,
    WATER_TREND_MAP,
    category_score,
    clean_binary,
    combined_ordinal_and_category,
    contains_flag,
    minmax,
    ordinal_1to5,
    yesno01,
)


def derive_enterprise(df: pd.DataFrame) -> pd.DataFrame:
    out = pd.DataFrame(index=df.index)
    out["zone_id"] = df.get("zone_id")

    water_source = df[find_col(df, "primary source of your establishment's water supply")]
    constraint = df[find_col(df, "water constraints affected your ability to operate")]
    rainwater = df[find_col(df, "does your enterprise have a rainwater harvesting system")]
    elec_peak = pd.to_numeric(df[find_col(df, "average monthly electricity bill during peak season")], errors="coerce")
    elec_off = pd.to_numeric(df[find_col(df, "average monthly electricity bill during off season")], errors="coerce")
    dustbins_yes = df[find_col(df, ["dustbins for waste collection", "yes"])]
    segregates_yes = df[find_col(df, ["separate dry and wet waste", "yes"])]
    municipal = df[find_col(df, ["manage sewage", "municipal"])]
    septic = df[find_col(df, ["manage sewage", "septic tank"])]
    own_stp = df[find_col(df, ["manage sewage", "own sewage treatment plant"])]
    no_sewage_system = df[find_col(df, ["manage sewage", "no system in place"])]
    ft_emp = pd.to_numeric(df[find_col(df, "how many full-time employees")], errors="coerce")
    seasonal_emp = pd.to_numeric(df[find_col(df, "how many seasonal or temporary employees")], errors="coerce")
    local_emp = pd.to_numeric(df[find_col(df, "number of employees that are residents of nainital district")], errors="coerce")
    child_labour = df[find_col(df, "child labour in the enterprise")]
    gov_support = df[find_col(df, ["government or institutional support", "off-season"])]

    # --- Water ---
    out["water_constraint_stress"] = category_score(constraint, WATER_CONSTRAINT_MAP)
    out["tanker_dependency"] = contains_flag(water_source, "tanker")
    out["no_rainwater_harvesting"] = 1 - yesno01(rainwater)
    ratio = elec_peak / elec_off.replace(0, np.nan)
    out["peak_offpeak_cost_pressure"] = minmax(ratio)

    # --- Waste & sanitation ---
    dustbins_bin = clean_binary(dustbins_yes)
    segregates_bin = clean_binary(segregates_yes)
    # enterprise_waste_practice_score simplified to (dustbins present, segregates waste);
    # collection-frequency term dropped -- categorical labels not reliably orderable.
    practice_score = pd.concat([dustbins_bin, segregates_bin], axis=1).mean(axis=1, skipna=True)
    out["poor_waste_practice"] = 1 - practice_score

    sewage_adequacy = pd.Series(np.nan, index=df.index)
    m, s, o, n = clean_binary(municipal), clean_binary(septic), clean_binary(own_stp), clean_binary(no_sewage_system)
    sewage_adequacy = sewage_adequacy.where(~((m == 1) | (o == 1)), 1.0)
    sewage_adequacy = sewage_adequacy.where(~((s == 1) & sewage_adequacy.isna()), 0.5)
    sewage_adequacy = sewage_adequacy.where(~((n == 1) & sewage_adequacy.isna()), 0.0)
    out["poor_sewage_adequacy"] = 1 - sewage_adequacy

    # --- Economic ---
    total_emp = (ft_emp.fillna(0) + seasonal_emp.fillna(0)).replace(0, np.nan)
    local_share = (local_emp / total_emp).clip(0, 1)
    out["non_local_employment_share"] = 1 - local_share
    out["no_offseason_gov_support"] = 1 - yesno01(gov_support)

    # --- Socio-cultural ---
    out["child_labour_observed"] = yesno01(child_labour)

    return out


def derive_location(df: pd.DataFrame) -> pd.DataFrame:
    out = pd.DataFrame(index=df.index)
    out["zone_id"] = df["zone_id"]
    out["latitude"] = df["latitude"]
    out["longitude"] = df["longitude"]

    emergency_time = pd.to_numeric(df[find_col(df, "time taken by ambulance")], errors="coerce")
    parking_hotel = pd.to_numeric(df[find_col(df, "number of hotel based parking spots")], errors="coerce")
    parking_public = pd.to_numeric(df[find_col(df, "number of public parking spots")], errors="coerce")
    footpaths = df[find_col(df, "are there dedicated footpaths")]
    street_lights = pd.to_numeric(df[find_col(df, "number of street lights")], errors="coerce")
    disability_friendly = df[find_col(df, "tourism infrastructure disable friendly")]
    potholes = df[find_col(df, "are there any potholes on the road")]
    waterlogging = df[find_col(df, "is there water logging on the road")]
    env_info = df[find_col(df, "are environmental guidelines displayed")]
    emergency_info = df[find_col(df, "emergency contact information displayed")]
    evac_info = df[find_col(df, "disaster/evacuation information displayed")]
    wifi = df[find_col(df, "public_open wifi connection")]
    dustbin_count = pd.to_numeric(df[find_col(df, "number of dustbins")], errors="coerce")
    toilet_count = pd.to_numeric(df[find_col(df, "how many public toilets are there in the zone")], errors="coerce")
    soap = df[find_col(df, "availability of soap")]
    water_avail = df[find_col(df, "availability of water")]
    healthcare = df[find_col(df, "healthcare facilities")]
    rules_displayed = df["tourist_rules_displayed"]

    # --- Infrastructure Adequacy (higher = better; inverted only at TVI stage) ---
    parts = [
        yesno01(footpaths),
        1 - yesno01(potholes),
        1 - yesno01(waterlogging),
        yesno01(wifi),
        yesno01(healthcare),
        yesno01(disability_friendly),
        yesno01(env_info),
        yesno01(emergency_info),
        yesno01(evac_info),
        yesno01(rules_displayed),
    ]
    out["infra_adequacy"] = pd.concat(parts, axis=1).mean(axis=1, skipna=True)
    out["parking_supply"] = minmax((parking_hotel.fillna(0) + parking_public.fillna(0)))
    out["street_light_density"] = minmax(street_lights)
    # Sphere floor: <20 users/toilet (RESEARCH_BENCHMARKS.md SS1.2); no verified per-zone
    # footfall count exists yet, so this is a relative (min-max across the 9 zones) proxy,
    # not an absolute occupancy-based adequacy score -- see notebook cell on this caveat.
    out["toilet_provision"] = minmax(toilet_count)
    out["soap_water_available"] = pd.concat([yesno01(soap), yesno01(water_avail)], axis=1).mean(axis=1, skipna=True)
    out["emergency_response_speed"] = 1 - minmax(emergency_time)

    # --- Waste & sanitation (zone-level) ---
    out["zone_dustbin_density"] = minmax(dustbin_count)
    out["zone_toilet_per_capita"] = minmax(toilet_count)

    return out


def derive_residents(df: pd.DataFrame) -> pd.DataFrame:
    out = pd.DataFrame(index=df.index)
    out["zone_id"] = df.get("zone_id")

    hours_supply = pd.to_numeric(df[find_col(df, "hours per day does your household typically receive piped water supply")], errors="coerce")
    tanker_source = clean_binary(df[find_col(df, ["drinking water from", "tanker supply"])])
    bought_tanker = df[find_col(df, "buy packaged water or hire a private tanker")]
    priority = df[find_col(df, "water needs of local residents are given priority")]
    trend = df["water_availability_trend_5yr"]
    rainwater = df[find_col(df, "does your household have a rainwater harvesting system")]
    sewage_type = df[find_col(df, "what is the sewage system of your house")]
    sewage_overflow = df[find_col(df, "sewage overflow or sanitation problems during the peak tourist season")]
    tourism_livelihood = df["tourism_primary_livelihood"]
    other_income = df[find_col(df, "other source of income besides tourism-related work")]
    avoids_crowded = df[find_col(df, "visit mall road or the naini lake as often")]
    travel_difficulty = df[find_col(df, "describe travelling within nainital during the peak tourist season")]
    price_inflation = df[find_col(df, "prices of daily goods")]
    noise = df["noise_rating_1to5"]
    env_trend = df[find_col(df, "condition of nainital's environment")]
    net_benefit = df[find_col(df, "tourism has helped nainital to grow and develop")]

    # --- Water ---
    out["water_hours_deficit"] = ((24 - hours_supply) / 24).clip(0, 1)
    out["tanker_dependency"] = tanker_source
    out["bought_tanker_water"] = yesno01(bought_tanker)
    out["water_deprioritized_vs_hotels"] = 1 - yesno01(priority)
    out["water_trend_worsened"] = category_score(trend, WATER_TREND_MAP)
    out["no_rainwater_harvesting"] = 1 - yesno01(rainwater)

    # --- Waste & sanitation ---
    sewage_adequacy = category_score(sewage_type, SEWAGE_ADEQUACY_MAP)
    out["poor_sewage_adequacy"] = 1 - sewage_adequacy
    out["sewage_overflow_peak"] = yesno01(sewage_overflow)

    # --- Economic ---
    out["tourism_dependency"] = yesno01(tourism_livelihood)
    out["no_other_income_source"] = 1 - yesno01(other_income)

    # --- Socio-cultural ---
    out["crowding_avoidance"] = 1 - yesno01(avoids_crowded)
    out["travel_difficulty_peak"] = 1 - ordinal_1to5(travel_difficulty)
    out["price_inflation_perception"] = category_score(price_inflation, PRICE_INFLATION_MAP)
    out["noise_increase_perception"] = combined_ordinal_and_category(noise, NOISE_CATEGORY_MAP)
    out["environment_trend_worsened"] = category_score(env_trend, ENV_TREND_MAP)
    out["tourism_no_net_benefit"] = 1 - yesno01(net_benefit)

    return out


def derive_tourist(df: pd.DataFrame) -> pd.DataFrame:
    out = pd.DataFrame(index=df.index)
    # Not GPS-tagged -- town-wide contribution only (workflow.md SS3).
    out["zone_id"] = None

    ease_nav = df["ease_of_navigation_1to5"]
    signage = df["signage_sufficiency_1to5"]
    cleanliness = df["cleanliness_rating_1to5"]
    satisfaction = df["overall_satisfaction_1to5"]
    dustbin_adequacy = df[find_col(df, "do you feel there are enough dustbins", required=False)]
    hired_none = df[find_col(df, "hired any local tourism services during your stay?/none")]
    bought_local = df[find_col(df, "purchased local products, handicrafts, or souvenirs during this trip")]

    # --- Visitor experience (higher = better; inverted only at TVI stage) ---
    out["ease_of_navigation"] = ordinal_1to5(ease_nav)
    out["signage_sufficiency"] = ordinal_1to5(signage)
    out["cleanliness_rating"] = ordinal_1to5(cleanliness)
    out["overall_satisfaction"] = ordinal_1to5(satisfaction)

    # --- Economic: how little a tourist puts back into the local economy. Reimplements
    # (not a byte-identical port of) Final_Pillar_Report.xlsx's Tourist Economic_Contribution
    # indicator (components c_econ_spend | c_econ_localprod) with this pipeline's own two
    # available yes/no fields -- hired any local service (guide/boating/etc, "None" = 0
    # hired) and bought local products/souvenirs -- inverted to this project's "1 = more
    # vulnerability/pressure" convention (workflow.md SS5 step 3), unlike the source
    # workbook's own (undocumented) direction.
    out["low_local_economic_engagement"] = 1 - pd.concat(
        [1 - clean_binary(hired_none), yesno01(bought_local)], axis=1
    ).mean(axis=1, skipna=True)

    # --- Waste & sanitation ---
    if dustbin_adequacy is not None:
        out["dustbin_inadequacy_perception"] = 1 - yesno01(dustbin_adequacy)

    return out


def derive_workers(df: pd.DataFrame) -> pd.DataFrame:
    out = pd.DataFrame(index=df.index)
    # Not GPS-tagged -- town-wide contribution only (workflow.md SS3).
    out["zone_id"] = None

    income_share = df[find_col(df, "share of your total annual income comes from tourism-related activities")]
    months_employed = pd.to_numeric(df[find_col(df, "for how many months in the previous year you received work")], errors="coerce")
    insurance = df[find_col(df, "access to any health insurance or accident coverage")]
    arrangement = df[find_col(df, "describe your current employment arrangement")]

    out["tourism_income_dependency"] = category_score(income_share, INCOME_SHARE_BUCKET_MAP)
    out["months_without_work_share"] = ((12 - months_employed) / 12).clip(0, 1)
    out["no_insurance"] = 1 - yesno01(insurance)
    # Reimplements (not a byte-identical port of) Final_Pillar_Report.xlsx's single-item
    # Worker_Security indicator with this pipeline's own available field: permanent
    # (year-round) vs. seasonal employment arrangement, direction-aligned so 1 = seasonal/
    # insecure.
    out["seasonal_employment_insecurity"] = category_score(
        arrangement, {"permanent (year-round)": 0.0, "seasonal": 1.0}
    )

    return out
