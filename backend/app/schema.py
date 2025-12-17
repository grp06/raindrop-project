# Single source of truth for the ClickHouse dataset + allowlisted columns (used by prompt, CFG, and query execution).
DATABASE = "default"
TABLE = "bodyPerformance"
DATASET = f"{DATABASE}.{TABLE}"

COLUMNS = (
    "age",
    "gender",
    "height_cm",
    "weight_kg",
    "body_fat_pct",
    "diastolic",
    "systolic",
    "grip_force",
    "sit_and_bend_forward_cm",
    "situps_count",
    "broad_jump_cm",
    "fitness_class",
)

NON_NUMERIC_COLUMNS = (
    "gender",
    "fitness_class",
)

NUMERIC_COLUMNS = tuple(column for column in COLUMNS if column not in NON_NUMERIC_COLUMNS)
