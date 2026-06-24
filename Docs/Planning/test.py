from Card import Card
from Page import Page
from Binder import Binder

print(Binder(3, 4).sheets)
print(Binder(3, 4).access_page(1))
print(Binder(3, 4).access_page(2))

page = Binder(3, 4).access_page(1)
card = Card(1, "Set A", "Card A", "url")
page.add_card(card, 0, 0)
print(page.slots)