#include "stm32f1xx.h"

int main(void)
{
    /* Тактирование порта A */
    RCC->APB2ENR |= RCC_APB2ENR_IOPAEN;

    /* PA0-PA7: выход push-pull, 2 МГц */
    GPIOA->CRL = 0x22222222UL;

    uint8_t pattern = 0x01U;   /* PA0 */

    while (1)
    {
        /* меняем только PA0-PA7, PA8-PA15 сохраняем */
        GPIOA->ODR = (GPIOA->ODR & 0xFF00U) | pattern;

        for (volatile uint32_t i = 0; i < 500000; i++)
            ;

        pattern <<= 1;         /* PA0 -> PA7 */

        if (pattern == 0U)
        {
            pattern = 0x01U;
        }
    }
}
