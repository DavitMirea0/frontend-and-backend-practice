#include "stm32f1xx.h"

int main(void)
{
    /* Тактирование порта A */
    RCC->APB2ENR |= RCC_APB2ENR_IOPAEN;

    /* PA0: выход push-pull, 2 МГц (CNF=00, MODE=10) */
    GPIOA->CRL &= ~(0xFUL << (0U * 4U));
    GPIOA->CRL |=  (0x2UL << (0U * 4U));

    while (1)
    {
        GPIOA->BSRR = (1UL << 0U);     /* PA0 = 1, светодиод включен */

        for (volatile uint32_t i = 0; i < 500000; i++)
            ;

        GPIOA->BSRR = (1UL << 16U);    /* PA0 = 0, светодиод выключен */

        for (volatile uint32_t i = 0; i < 500000; i++)
            ;
    }
}
