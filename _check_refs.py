import openpyxl
wb = openpyxl.load_workbook(r"C:\Users\Admin\Documents\IdolBias_Roster_Master.xlsx")
wr = wb["Références"]
print("Références A1:B12 :")
for r in range(1,13):
    a = wr.cell(row=r,column=1).value
    b = wr.cell(row=r,column=2).value
    print(r, repr(a), "|", repr(b))
# Vérif range VLOOKUP dans Characters
ws = wb["Characters"]
print("\nFormule refPrefix L2:", ws.cell(row=2,column=16).value)
