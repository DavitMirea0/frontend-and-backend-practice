//Хачатрян Давид Каренович ЭФБО-18-24
#include <iostream>
using namespace std;
class MusicalInstrument {
protected:
    string brand, type;
public:
    MusicalInstrument(const string& b, const string& c) : brand(b), type(c)
    {
    }
};
class Drum : public MusicalInstrument {
    double diametr;
public:
    Drum(const std::string& b, double d) : MusicalInstrument(b, "Барабан"), diametr(d) {}
    void printInfo() { std::cout << brand << " " << type << ", Диаметр: " << diametr << " Дюймов"; }
};
int main()
{
    setlocale(LC_ALL, "Russian");
    Drum d("Dixon", 14.0);
    d.printInfo();
    return 0;
}