#include "stm32f4xx.h"

/* Настройки */
#define CURRENT_YEAR       2026U
#define BIRTH_YEAR         2005U  // Замени на свой год рождения
#define DP_POSITION        1U    // Второй разряд слева
#define DIGIT_ACTIVE_LOW   0     // 0: разряд включается единицей

static volatile uint32_t ticks_ms = 0U;

/* PA0–PA6 соответствуют сегментам a–g.
   PA7 — десятичная точка. */
static const uint8_t digit_code[10] = {
    0x3F,  // 0
    0x06,  // 1
    0x5B,  // 2
    0x4F,  // 3
    0x66,  // 4
    0x6D,  // 5
    0x7D,  // 6
    0x07,  // 7
    0x7F,  // 8
    0x6F   // 9
};

/* Прерывание каждую миллисекунду */
void SysTick_Handler(void)
{
    ticks_ms++;
}

/* Задержка в миллисекундах */
static void delay_ms(uint32_t ms)
{
    uint32_t start = ticks_ms;

    while ((uint32_t)(ticks_ms - start) < ms) {
        __NOP();
    }
}

/* Выключить все разряды */
static void digits_off(void)
{
#if DIGIT_ACTIVE_LOW
    GPIOC->BSRR = 0x0FU;
#else
    GPIOC->BSRR = 0x0FU << 16U;
#endif
}

/* Передать код на PA0–PA7 */
static void segments_write(uint8_t pattern)
{
    uint32_t bits = pattern;

    GPIOA->BSRR =
        ((0xFFU & ~bits) << 16U) | bits;
}

/* Включить один разряд:
   position = 0 — крайний слева,
   position = 3 — крайний справа. */
static void show_digit(uint32_t position, uint8_t pattern)
{
    digits_off();
    segments_write(pattern);

#if DIGIT_ACTIVE_LOW
    GPIOC->BSRR = 1U << (position + 16U);
#else
    GPIOC->BSRR = 1U << position;
#endif
}

/* Настроить вывод как выход push-pull */
static void output_init(GPIO_TypeDef *port, uint32_t pin)
{
    port->MODER &= ~(3U << (pin * 2U));
    port->MODER |=  (1U << (pin * 2U));

    port->OTYPER  &= ~(1U << pin);
    port->OSPEEDR &= ~(3U << (pin * 2U));
    port->PUPDR   &= ~(3U << (pin * 2U));
}

/* Настройка GPIO */
static void gpio_init(void)
{
    RCC->AHB1ENR |= RCC_AHB1ENR_GPIOAEN
                 | RCC_AHB1ENR_GPIOBEN
                 | RCC_AHB1ENR_GPIOCEN;

    (void)RCC->AHB1ENR;

    digits_off();
    segments_write(0U);

    /* PA0–PA7 — сегменты */
    for (uint32_t pin = 0U; pin < 8U; pin++) {
        output_init(GPIOA, pin);
    }

    /* PC0–PC3 — управление разрядами */
    for (uint32_t pin = 0U; pin < 4U; pin++) {
        output_init(GPIOC, pin);
    }

    /* PB0 — вход с подтяжкой к питанию */
    GPIOB->MODER &= ~3U;
    GPIOB->PUPDR &= ~3U;
    GPIOB->PUPDR |=  1U;
}

/* Один полный цикл вывода четырехзначного числа.
   dot_enabled = 1 — включить точку.
   Функцию нужно вызывать постоянно. */
static void display_number(uint32_t number, uint32_t dot_enabled)
{
    uint8_t digits[4];

    number %= 10000U;

    digits[0] = (uint8_t)(number / 1000U);
    digits[1] = (uint8_t)((number / 100U) % 10U);
    digits[2] = (uint8_t)((number / 10U) % 10U);
    digits[3] = (uint8_t)(number % 10U);

    for (uint32_t position = 0U; position < 4U; position++) {
        uint8_t pattern = digit_code[digits[position]];

        if (dot_enabled && position == DP_POSITION) {
            pattern |= 0x80U;
        }

        show_digit(position, pattern);
        delay_ms(2U);
    }

    digits_off();
}

/* ==================================================
   1. Статическая индикация цифры 5
   ================================================== */
static void mode_static_digit(void)
{
    show_digit(0U, digit_code[5]);

    while (1) {
        __NOP();
    }
}

/* ==================================================
   2. Динамическая индикация числа 2026
   ================================================== */
static void mode_dynamic_year(void)
{
    while (1) {
        display_number(CURRENT_YEAR, 0U);
    }
}

/* ==================================================
   3. Переключение года по PB0 — задание 5.1

   PB0 = 1: текущий год.
   PB0 = 0: год рождения.
   ================================================== */
static void mode_button_year(void)
{
    while (1) {
        uint32_t number;

        if ((GPIOB->IDR & 1U) == 0U) {
            number = BIRTH_YEAR;
        } else {
            number = CURRENT_YEAR;
        }

        display_number(number, 0U);
    }
}

/* ==================================================
   4. Переключение годов и десятичная точка
   Задания 5.1 и 5.2
   ================================================== */
static void mode_year_with_dot(void)
{
    while (1) {
        uint32_t number;

        if ((GPIOB->IDR & 1U) == 0U) {
            number = BIRTH_YEAR;
        } else {
            number = CURRENT_YEAR;
        }

        display_number(number, 1U);
    }
}

/* ==================================================
   5. Счетчик секунд — задание 5.3

   0000 -> 0001 -> ... -> 9999 -> 0000
   ================================================== */
static void mode_seconds_counter(void)
{
    uint32_t seconds = 0U;
    uint32_t last_second = ticks_ms;

    while (1) {
        uint32_t now = ticks_ms;

        while ((uint32_t)(now - last_second) >= 1000U) {
            last_second += 1000U;
            seconds = (seconds + 1U) % 10000U;
        }

        display_number(seconds, 0U);
    }
}

int main(void)
{
    gpio_init();

    SystemCoreClockUpdate();

    if (SysTick_Config(SystemCoreClock / 1000U) != 0U) {
        digits_off();

        while (1) {
            __NOP();
        }
    }

    /* Оставь один нужный вызов: */

    // mode_static_digit();       // Цифра 5
    // mode_dynamic_year();       // Число 2026
    // mode_button_year();        // Переключение по PB0
    mode_year_with_dot();         // Переключение + точка
    // mode_seconds_counter();    // Счетчик секунд

    while (1) {
        __NOP();
    }
}