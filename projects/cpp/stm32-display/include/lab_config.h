#ifndef LAB_CONFIG_H
#define LAB_CONFIG_H

#ifndef LAB_MODE
#define LAB_MODE 4
#endif

#define CURRENT_YEAR 2026U
#define BIRTH_YEAR 2005U /* Замените на свой год рождения. */
#define STATIC_DIGIT 5U
#define STATIC_POSITION 0U
#define DP_POSITION 1U /* 0 — слева; 3 — справа. */

/* Общий катод: сегменты активны единицей, разряды — нулем.
 * При инвертирующем драйвере разрядов измените DIGIT_ACTIVE_LOW.
 * Для общего анода обычно нужны значения 1 и 0 соответственно. */
#define SEGMENT_ACTIVE_LOW 0
#define DIGIT_ACTIVE_LOW 0

/* Укажите номера PCx слева направо, если разводка стенда отличается. */
#define DIGIT_PINS {0U, 1U, 2U, 3U}

#if LAB_MODE < 1 || LAB_MODE > 5
#error LAB_MODE must be between 1 and 5
#endif
#if STATIC_DIGIT > 9 || STATIC_POSITION > 3 || DP_POSITION > 3
#error Invalid digit or position
#endif
#if CURRENT_YEAR > 9999 || BIRTH_YEAR > 9999
#error Year must fit four digits
#endif

#endif
