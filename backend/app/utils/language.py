LANGUAGES = {
    "English": {"native": "English", "flag": "🇬🇧"},
    "Amharic": {"native": "አማርኛ", "flag": "🇪🇹"},
    "Arabic": {"native": "العربية", "flag": "🇸🇦"},
    "Somali": {"native": "Soomaali", "flag": "🇸🇴"},
    "Tigrinya": {"native": "ትግርኛ", "flag": "🇪🇹"},
    "Afar": {"native": "Qafar af", "flag": "🇪🇹"},
    "Afaan Oromo": {"native": "Afaan Oromoo", "flag": "🇪🇹"},
    "Chinese": {"native": "中文", "flag": "🇨🇳"},
    "French": {"native": "Français", "flag": "🇫🇷"},
    "Spanish": {"native": "Español", "flag": "🇪🇸"},
}

SUPPORTED_LANGUAGES = tuple(LANGUAGES)


def is_supported_language(language: str) -> bool:
    return language in SUPPORTED_LANGUAGES


def get_language_instruction(language: str) -> str:
    if language == "Auto-detect":
        return (
            "Detect the language used by the user and respond in "
            "that same language. If the user asks for a translation "
            "or another output language, follow that request."
        )

    if is_supported_language(language):
        return f"Respond naturally and clearly in {language}."

    return "Respond naturally and clearly in English."