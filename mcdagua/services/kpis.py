def calculate_kpis(df):
    if "checklist" not in df.columns:
        return {"total": len(df), "ok": 0, "micro_na": 0}

    total = len(df)
    ok_count = (df["checklist"].astype(str).str.lower() == "ok").sum()
    micro = (df["checklist"].astype(str).str.lower() == "micro").sum()
    na = (df["checklist"].astype(str).str.lower() == "na").sum()

    return {
        "total": total,
        "ok": ok_count,
        "micro_na": micro + na
    }
