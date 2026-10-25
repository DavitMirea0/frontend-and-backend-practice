//Хачатрян Давид Каренович ЭФБО-18-24
#include <iostream>
using namespace std;
class Monitor {
public:
    void display(int width, int height) {
        if (width < 800 || height < 600) {
            throw runtime_error("Неподдерживаемые разрешение (минимальный 800x600)");
        }
        cout << "Отображение на " << width << "x" << height << endl;
    }
};
int main() {
    setlocale(LC_ALL, "Russian");
    Monitor m;
    try {
        m.display(1024, 768); 
        m.display(640, 480);
    }
    catch (const exception& e) {
        cerr << "Ошибка: " << e.what() << endl;
    }
    return 0;
}