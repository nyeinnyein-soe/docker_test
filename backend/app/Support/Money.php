<?php

namespace App\Support;

/**
 * Simple money calculation helper using regular PHP arithmetic.
 * All amounts are handled as strings with 2 decimal places.
 */
class Money
{
    /**
     * Add two money amounts.
     */
    public static function add(string|float $a, string|float $b): string
    {
        return number_format((float) $a + (float) $b, 0, '.', '');
    }

    /**
     * Subtract b from a.
     */
    public static function sub(string|float $a, string|float $b): string
    {
        return number_format((float) $a - (float) $b, 0, '.', '');
    }

    /**
     * Multiply two values.
     */
    public static function mul(string|float $a, string|float $b, int $decimals = 0): string
    {
        return number_format((float) $a * (float) $b, $decimals, '.', '');
    }

    /**
     * Divide a by b.
     */
    public static function div(string|float $a, string|float $b, int $decimals = 0): string
    {
        if ((float) $b == 0) {
            return '0';
        }
        return number_format((float) $a / (float) $b, $decimals, '.', '');
    }

    /**
     * Compare two money amounts.
     * Returns: -1 if a < b, 0 if equal, 1 if a > b
     */
    public static function compare(string|float $a, string|float $b): int
    {
        $diff = (float) $a - (float) $b;
        if (abs($diff) < 0.1) {
            return 0;
        }
        return $diff > 0 ? 1 : -1;
    }

    /**
     * Format a value as money string.
     */
    public static function format(string|float $amount, int $decimals = 0): string
    {
        return number_format((float) $amount, $decimals, '.', '');
    }
}
