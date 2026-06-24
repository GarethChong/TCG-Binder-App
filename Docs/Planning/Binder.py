from Card import Card
from Page import Page

class Binder:
    def __init__(self, sheet_number, page_size):
        if page_size > 5:
            self.page_size = 5
        else:
            self.page_size = page_size
        if sheet_number > 15:
            self.sheet_number = 15
        else:
            self.sheet_number = sheet_number
        self.sheets = {}
        self.sheets[1] = Page(self.page_size)
        self.sheets[self.sheet_number * 2] = Page(self.page_size)
        for i in range(2, self.sheet_number * 2, 2) :
            self.sheets[i] = (Page(self.page_size), Page(self.page_size))
    
    def access_page(self, page_number):
        if page_number <= self.sheet_number * 2:
            if page_number % 2 == 1 and page_number != 1 and page_number != self.sheet_number * 2:
                page_number -= 1
            return self.sheets[page_number]
        else:
            print("Page does not exist")

    def add_page(self):
        if self.sheet_number < 15:
            self.sheets[self.sheet_number * 2] = (self.sheets[self.sheet_number * 2], Page(self.page_size))
            self.sheet_number += 1
            self.sheets[self.sheet_number * 2] = Page(self.page_size)
        else:
            print("Maximum number of pages reached")
    
    def remove_page(self):
        if self.sheet_number > 1:
            del self.sheets[self.sheet_number * 2]
            self.sheet_number -= 1
            self.sheets[self.sheet_number * 2] = self.sheets[self.sheet_number * 2][0]
        else:
            print("Minimum number of pages reached")