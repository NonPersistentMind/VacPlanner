import json
from config import SOURCE_FOLDER

ALL_SLICE = slice(None)

vaccineColors = [
            '#FF0000',
            '#102542',
            '#E4FF1A',
            '#FDBF7E',
            '#2E2532',
            '#FBFBFB',
            '#C8C6C9',
            '#2374AB',
            '#508991',
            '#820263',
            '#C1666B',
            '#BB4430',
            '#A40E4C',
            '#FEA13F',
            '#80DED9'
        ]

# ukraine_map_json = json.load(open(SOURCE_FOLDER / 'ukraine-regions.json', 'r', encoding='utf-8'))
# # ukraine_map_json['features'][0]['properties']['name'] = 'Україна'
# for i in range(1, len(ukraine_map_json['features'])):
#     name = ukraine_map_json['features'][i]['properties']['NL_NAME_1']
#     name = name if name != 'Київ' else 'м. Київ'
#     name = name if name != "NA" else "Львівська"
#     name = name if "Дон" not in name else "Донецька"
#     name = name if "Дніпро" not in name else "Дніпропетровська"
    
#     ukraine_map_json['features'][i]['properties']['name'] = name
    
# kyiv_coords = ukraine_map_json['features'][0]['geometry']['coordinates'][0][0] + [feature for feature in ukraine_map_json['features'] if feature['properties'].get('name', None) == 'м. Київ'][0]['geometry']['coordinates'][0][0]
# kyiv_coords = ConvexHull(kyiv_coords).points.tolist()
# [feature for feature in ukraine_map_json['features'] if feature['properties'].get('name', None) == 'м. Київ'][0]['geometry']['coordinates'][0][0] = kyiv_coords
# ukraine_map_json['features'] = ukraine_map_json['features'][1:]

# disease_vaccine_dict = {
#     "Дифтерія": [vaccine for vaccine in vaccines if "дифтерії" in vaccine],
#     "Правець": [vaccine for vaccine in vaccines if "правця" in vaccine],
#     "Гемофільна інфекція": [vaccine for vaccine in vaccines if "гемофільної інфекції" in vaccine],
#     "Гепатит В": [vaccine for vaccine in vaccines if "гепатиту В" in vaccine],
#     "Кашлюк": [vaccine for vaccine in vaccines if "кашлюку" in vaccine],
#     "Кір": [vaccine for vaccine in vaccines if "кору" in vaccine],
#     "Паротит": [vaccine for vaccine in vaccines if "паротиту" in vaccine],
#     "Краснуха": [vaccine for vaccine in vaccines if "краснухи" in vaccine],
#     "Поліомієліт": [vaccine for vaccine in vaccines if "поліомієліту" in vaccine],
#     "Сказ": [vaccine for vaccine in vaccines if "сказу" in vaccine],
#     "Туберкульоз": [vaccine for vaccine in vaccines if "туберкульозу" in vaccine],
# }
ukraine_map_json = json.load(open(SOURCE_FOLDER / 'ukraine-regions.json', 'r', encoding='utf-8'))


vaccine_shorts = {vaccine.split(' – ')[0]: vaccine.split(' – ')[1] for vaccine in [
    'Вакцина для профілактики поліомієліту (оральна) – ОПВ',
    'Вакцина для профілактики поліомієліту (інактивована) – ІПВ',
    'Вакцина для профілактики туберкульозу – БЦЖ',
    'Вакцина для профілактики кашлюку, дифтерії та правця з цільноклітинним кашлюковим компонентом – АКДП',
    'Вакцина для профілактики кору, паротиту та краснухи – КПК',
    'Вакцина для профілактики гепатиту В для дітей – ГепВ',
    'Вакцина для профілактики гепатиту В для дорослих – ГепВ-Дор',
    'Вакцина для профілактики правця – Правець',
    'Анатоксин для профілактики дифтерії та правця (АДП) – АДП',
    'Анатоксин для профілактики дифтерії та правцю з зменшеним вмістом антигену (АДП-М) – АДП-М',
    'Вакцина для профілактики гемофільної інфекції типу b – ХІБ',
    # 'Комбінована вакцина для профілактики кашлюку з цільноклітинним кашлюковим компонентом, дифтерії, правця, гепатиту В та гемофільної інфекції типу b – Пента',
    'Комбінована вакцина для профілактики кашлюка з цільноклітинним кашлюковим компонентом, дифтерії, правця, гепатиту В та гемофільної інфекції типу b – Пента',
    'Комбінована вакцина для профілактики дифтерії, правця, коклюшу, гемофільної інфекції та поліомієліту – ДПКГП',
    'Вакцина для профілактики сказу – Сказ',
    'Вакцина для профілактики кашлюку,дифтерії та правця з цільноклітинним кашлюковим компонентом – АКДП',
]}

region_positions = {
    'Вінницька': 0,
    'Волинська': 1,
    'Дніпропетровська': 2,
    'Донецька': 3,
    'Житомирська': 4,
    'Закарпатська': 5,
    'Запорізька': 6,
    'Івано-Франківська': 7,
    'Київська': 8,
    'Кіровоградська': 9,
    'Львівська': 10,
    'Миколаївська': 11,
    'НацСклади':11.5,
    'Одеська': 12,
    'Полтавська': 13,
    'Рівненська': 14,
    'Сумська': 15,
    'Тернопільська': 16,
    'Україна': 17,
    'Харківська': 17+1,
    'Херсонська': 18+1,
    'Хмельницька': 19+1,
    'Черкаська': 20+1,
    'Чернівецька': 21+1,
    'Чернігівська': 22+1,
    'м. Київ': 23+1
}

EC = {
    'bold': '\033[1m',
    'italic': '\033[3m',
    'default': '\033[0m'
}
