import { describe, expect, it } from 'vitest';
import { buildMaxJson, buildTelegramJson, createEmptyMessage } from '@/lib/message-builder';
import { prepareMarkdownV2 } from '@/lib/markdown';

describe('message-builder', () => {
  it('preserves valid Telegram MarkdownV2 escapes and nested formatting', () => {
    const input = 'Здравствуйте, Даниил Коробко\\.\n\n*Спасибо за заказ № 2002369649 *\n\n*__Сумма заказа: 23\\.17  BYN__*\n\n📦 Способ получения\\: Самовывоз из ПВЗ Армтек';

    expect(prepareMarkdownV2(input)).toBe(
      'Здравствуйте, Даниил Коробко\\.\n\n*Спасибо за заказ № 2002369649 *\n\n*__Сумма заказа: 23\\.17  BYN__*\n\n📦 Способ получения\\: Самовывоз из ПВЗ Армтек'
    );
  });

  it('builds Telegram JSON with reply_markup and prepared text', () => {
    const message = {
      ...createEmptyMessage(),
      platform: 'telegram' as const,
      chatId: '258110807',
      parseMode: 'MarkdownV2' as const,
      text: 'Здравствуйте, Даниил Коробко\\.\n\n*Спасибо за заказ № 2002369649 *',
      buttonRows: [
        {
          id: 'row-1',
          buttons: [
            {
              id: 'btn-1',
              text: '❌ Отменить заказ',
              callback_data: '{"action": "OrderCancel", "id": "2002369649"}',
            },
          ],
        },
        {
          id: 'row-2',
          buttons: [
            {
              id: 'btn-2',
              text: '🛒 Перейти к заказу',
              url: 'http://q-store.uk.armtek.local/order/index/0100000196/2000017599',
            },
          ],
        },
      ],
    };

    expect(buildTelegramJson(message)).toEqual({
      chat_id: '258110807',
      text: 'Здравствуйте, Даниил Коробко\\.\n\n*Спасибо за заказ № 2002369649 *',
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '❌ Отменить заказ',
              callback_data: '{"action": "OrderCancel", "id": "2002369649"}',
            },
          ],
          [
            {
              text: '🛒 Перейти к заказу',
              url: 'http://q-store.uk.armtek.local/order/index/0100000196/2000017599',
            },
          ],
        ],
      },
    });
  });

  it('builds MAX JSON in expected schema with button rows', () => {
    const message = {
      ...createEmptyMessage(),
      platform: 'max' as const,
      parseMode: 'MarkdownV2' as const,
      text: 'Уважаемый клиент.\n\n📦 __Доставка Вашего товара ожидается с 10:00 по 14:00__.',
      buttonRows: [
        {
          id: 'row-1',
          buttons: [
            {
              id: 'btn-1',
              text: '➡️ Отследить доставку',
              url: 'https://armtek.ru/tracking/delivery-status-info',
            },
          ],
        },
      ],
    };

    expect(buildMaxJson(message)).toEqual({
      format: 'markdown',
      text: 'Уважаемый клиент.\n\n📦 __Доставка Вашего товара ожидается с 10:00 по 14:00__.',
      attachments: [
        {
          type: 'inline_keyboard',
          payload: {
            buttons: [
              [
                {
                  type: 'link',
                  text: '➡️ Отследить доставку',
                  url: 'https://armtek.ru/tracking/delivery-status-info',
                },
              ],
            ],
          },
        },
      ],
    });
  });
});