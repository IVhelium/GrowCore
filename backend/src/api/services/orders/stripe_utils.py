def stripe_metadata_value(value: object, max_length: int = 500) -> str:
    text = "" if value is None else str(value)
    return text[:max_length]


def stripe_object_to_dict(value):
    if isinstance(value, dict):
        return {
            key: stripe_object_to_dict(item)
            for key, item in value.items()
        }

    if isinstance(value, list):
        return [stripe_object_to_dict(item) for item in value]

    try:
        stripe_data = object.__getattribute__(value, "_data")
    except (AttributeError, TypeError):
        stripe_data = None

    if isinstance(stripe_data, dict):
        return stripe_object_to_dict(stripe_data)

    return value


def format_stripe_address(details: dict | None) -> str | None:
    if not details:
        return None

    address = details.get("address") if isinstance(details, dict) else None
    if not address:
        return None

    raw_parts = [
        details.get("name"),
        address.get("line1"),
        address.get("city"),
        address.get("state"),
        address.get("postal_code"),
        address.get("country"),
    ]
    parts = [
        str(part).strip()
        for part in raw_parts
        if part is not None and str(part).strip() and str(part).strip() != "-"
    ]

    if not parts:
        return None

    return ", ".join(parts)[:300] or None


def get_stripe_shipping_country(session: dict) -> str | None:
    shipping_details = session.get("shipping_details") or {}
    customer_details = session.get("customer_details") or {}

    for details in (shipping_details, customer_details):
        address = details.get("address") if isinstance(details, dict) else None
        country = address.get("country") if isinstance(address, dict) else None

        if country:
            return str(country).strip().upper()

    return None


def get_stripe_custom_field(session: dict, key: str) -> str | None:
    for field in session.get("custom_fields") or []:
        if field.get("key") != key:
            continue

        value = (field.get("text") or {}).get("value")
        if value:
            return str(value).strip()

    return None
