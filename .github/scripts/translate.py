import json
import os
import time
import random
from googletrans import Translator

def translate_with_retry(translator, text, dest, max_retries=3, base_delay=1):
    for attempt in range(max_retries):
        try:
            translated = translator.translate(text, dest=dest)
            return translated.text
        except Exception:
            if attempt == max_retries - 1:
                raise
            delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
            time.sleep(delay)
    return text

def main():
    with open('./public/locales/en/common.json', 'r', encoding='utf-8') as file:
        data = json.load(file)

    languages = [
        "es", "de", "ja", "fr", "pt", "ru", "it", "nl", "pl",
        "tr", "fa", "zh-CN", "zh-TW", "vi", "id", "cs", "ko", "uk", "hu", "sv",
        "ar", "ro", "el", "he", "da", "fi", "sk", "th", "bg", "sr",
        "hr", "lt", "no", "sl", "ca", "et", "lv"
    ]

    translator = Translator(service_urls=[
        'translate.google.com',
        'translate.google.co.kr',
        'translate.google.cn',
        'translate.google.de',
        'translate.google.fr',
        'translate.google.jp',
        'translate.google.ru',
        'translate.google.es',
        'translate.google.com.tw',
        'translate.google.com.hk',
        'translate.google.com.br',
        'translate.google.it',
        'translate.google.nl',
        'translate.google.pl',
        'translate.google.com.tr'
    ])

    for lang in languages:
        lang_dir = f'./public/locales/{lang}'
        os.makedirs(lang_dir, exist_ok=True)
        output_path = f'{lang_dir}/common.json'
        
        if os.path.exists(output_path):
            pass #continue
            
        translated_data = {}
        for key, value in data.items():
            if key.lower() == "smiley":
                translated_data[key] = value
                continue
                
            try:
                dest_lang = lang
                if lang == 'zh-CN':
                    dest_lang = 'zh-cn'
                elif lang == 'zh-TW':
                    dest_lang = 'zh-tw'
                
                translated_text = translate_with_retry(translator, value, dest_lang)
                translated_data[key] = translated_text
                
            except Exception:
                translated_data[key] = value

        with open(output_path, 'w', encoding='utf-8') as file:
            json.dump(translated_data, file, ensure_ascii=False, indent=2)
        
        time.sleep(random.uniform(0.5, 1.5))

if __name__ == "__main__":
    main()