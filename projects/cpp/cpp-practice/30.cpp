//Хачатрян Давид Каренович ЭФБО-18-24
using namespace std;
class Shape
{
public:
    virtual double area() const { return 0; }
};
class Flower : public Shape {
public:
    double area() const override { return 0.5; }
};
int main() {
    setlocale(LC_ALL, "Russian");
    Shape* shape = new Flower();
    cout << "Область цветка: " << shape->area() << endl;
    delete shape;
    return 0;
}