from dataclasses import dataclass, fields

@dataclass
class DS:
    """
    Data Source
    """
    region = "Регіон"
    edrpou = "код ЄДРПОУ"
    facility = "Заклад"
    vacname = "Міжнародна непатентована назва"
    vacseries = "Серія препарату"
    manufacturer = "Виробник"
    fundsource = "Джерело фінансування"
    exp_date = "Термін придатності"
    defrost_exp_date = "Термін придатності після розморожування"
    doses = "Кількість доз"
    quarantined_doses = "Кількість доз на карантині"
    utilized_doses = "Кількість використаних доз"
    broken_doses = "Кількість розлитих доз"
    upd_date = "дата оновлення"
    latitude = "Широта"
    longitude = "Довгота"
    
    def __iter__(self):
        for field in fields(self):
            yield getattr(self, field.name)
            
@dataclass
class NS:
    """
    National Stock
    """
    vacname = DS.vacname, 
    region = DS.region, 
    doses = DS.doses, 
    storage_place = 'Місце зберігання',
    fundsource = DS.fundsource
    supply_date = 'Дата поставки'
    responsible = 'Відповідальний за імпорт'
    
    def __iter__(self):
        for field in fields(self):
            yield getattr(self, field.name)