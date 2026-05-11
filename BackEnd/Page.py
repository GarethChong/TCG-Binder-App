class Page:
    def __init__(self, size): 
        self.slots = [None] * size
        for i in range(size):
            self.slots[i] = [None] * size
            for j in range(size):
                self.slots[i][j] = None
        self.cost = 0
        
    def add_card(self, card, slot_row, slot_col):
        if self.slots[slot_row][slot_col] is not None:
            print("Slot is already occupied")
        else: 
            self.slots[slot_row][slot_col] = card
            self.cost += card.fetch_price()

    def remove_card(self, slot_row, slot_col):
        if self.slots[slot_row][slot_col] is None:
            print("Slot is already empty")
        else: 
            self.cost -= self.slots[slot_row][slot_col].fetch_price()
            self.slots[slot_row][slot_col] = None

    def shift_card(self, from_row, from_col, to_row, to_col):
        if self.slots[from_row][from_col] is None and self.slots[to_row][to_col] is None:
                print("No cards available to shift")
        else:
            temp_card = self.slots[from_row][from_col]
            self.slots[from_row][from_col] = self.slots[to_row][to_col]
            self.slots[to_row][to_col] = temp_card