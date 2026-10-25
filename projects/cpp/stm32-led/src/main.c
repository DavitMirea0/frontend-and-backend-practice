#include "stm32f4xx.h"

void delay(volatile uint32_t t) {
    while (t--) __NOP();
}

int main(void) {
    RCC->AHB1ENR |= RCC_AHB1ENR_GPIOAEN;

    for (int i = 0; i < 8; i++) {
        GPIOA->MODER   &= ~(0x3U << (i * 2U));
        GPIOA->MODER   |=  (0x1U << (i * 2U));
        GPIOA->OTYPER  &= ~(1U << i);
        GPIOA->OSPEEDR &= ~(0x3U << (i * 2U));
        GPIOA->PUPDR   &= ~(0x3U << (i * 2U));
    }

    uint8_t pattern = 0x80U;

    while (1) {
        GPIOA->ODR = (GPIOA->ODR & 0xFF00U) | pattern;
        delay(200000);

        pattern >>= 1;
        if (pattern == 0U) {
            pattern = 0x80U;
        }
    }
}