//Хачатрян Давид Каренович ЭФБО-18-24
#include <iostream>
using namespace std;
class Computer
{
private:
    string model;
    string processor;
    int ram;
public:
    Computer(const string& m, const string& p, int r) : model(m), processor(p), ram(r) {}

    string getModel() const { return model; }
    string getProcessor() const { return processor; }
    int getRAM() const { return ram; }

    void setModel(const string& m) { model = m; }
    void setProcessor(const string& p) { processor = p; }
    void setRAM(int r) { if (r > 0) ram = r; }
};

int main()
{
    Computer pc("Lenovo Xiaoxin Pro 16GT 2025", "Intel Core Ultra 9", 32);
    cout << pc.getModel() << " | " << pc.getRAM() << "GB" << endl; // Выводим модель и RAM

    pc.setRAM(48); // Устанавливаем новое значение RAM
    cout << pc.getRAM() << "GB" << endl; // Выводим обновлённый RAM
    return 0;
}