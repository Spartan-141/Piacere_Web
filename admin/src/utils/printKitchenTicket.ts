/**
 * printKitchenTicket
 * ─────────────────────────────────────────────────────────────
 * Opens a new browser window with a kitchen ticket formatted for
 * thermal printer (58 mm / 80 mm) and triggers window.print().
 *
 * The ticket shows:
 *   - Restaurant name / title
 *   - Order number & table
 *   - Order type (Dine-in / Takeaway)
 *   - Date & time
 *   - List of items (qty × name, extras, notes)
 *   - Footer separator
 *
 * No backend changes needed; works with any OS printer including
 * thermal printers that appear as system printers.
 */

interface TicketItem {
  quantity: number;
  product_name?: string | null;
  combo_name?: string | null;
  notes?: string | null;
  extras?: { name: string }[];
}

interface TicketOrder {
  order_number: string;
  table_name?: string | null;
  type: 'dine_in' | 'takeaway' | string;
  created_at: string;
  items: TicketItem[];
  customer_name?: string | null;
}

export function printKitchenTicket(order: TicketOrder): void {
  const now = new Date();
  const isoDate = order.created_at.endsWith('Z')
    ? order.created_at
    : order.created_at + 'Z';
  const orderDate = new Date(isoDate).toLocaleString('es-VE', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  const printTime = now.toLocaleTimeString('es-VE', { timeStyle: 'short' });

  const typeLabel =
    order.type === 'dine_in'
      ? '🍽️ COMER AQUÍ'
      : '📦 PARA LLEVAR';

  const itemsHtml = order.items
    .map((item) => {
      const name = item.product_name || item.combo_name || 'Ítem';
      const extrasText =
        item.extras && item.extras.length > 0
          ? `<div class="extras">+ ${item.extras.map((e) => e.name).join(', ')}</div>`
          : '';
      const notesText = item.notes
        ? `<div class="notes">📝 ${item.notes}</div>`
        : '';
      return `
        <div class="item">
          <span class="qty">${item.quantity}×</span>
          <div class="item-detail">
            <span class="item-name">${name}</span>
            ${extrasText}
            ${notesText}
          </div>
        </div>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Ticket Cocina — ${order.order_number}</title>
  <style>
    /* ── Reset & base ── */
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 13px;
      color: #000;
      background: #fff;
      width: 80mm;
      padding: 4mm 3mm;
    }

    /* ── Header ── */
    .header {
      text-align: center;
      border-bottom: 2px dashed #000;
      padding-bottom: 5px;
      margin-bottom: 8px;
    }
    .restaurant-name {
      font-size: 18px;
      font-weight: bold;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .ticket-title {
      font-size: 14px;
      font-weight: bold;
      margin-top: 3px;
      letter-spacing: 2px;
    }

    /* ── Meta ── */
    .meta {
      margin-bottom: 8px;
      font-size: 12px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }
    .meta-row .label { font-weight: normal; color: #444; }
    .meta-row .value { font-weight: bold; }

    .order-number {
      font-size: 22px;
      font-weight: bold;
      text-align: center;
      margin: 6px 0;
      letter-spacing: 1px;
    }
    .type-badge {
      text-align: center;
      font-size: 13px;
      font-weight: bold;
      padding: 3px 0;
      border: 2px solid #000;
      margin-bottom: 8px;
      letter-spacing: 1px;
    }

    /* ── Items ── */
    .items-title {
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-top: 1px dashed #000;
      border-bottom: 1px dashed #000;
      padding: 4px 0;
      margin-bottom: 6px;
    }
    .item {
      display: flex;
      align-items: flex-start;
      gap: 4px;
      margin-bottom: 6px;
    }
    .qty {
      font-size: 15px;
      font-weight: bold;
      min-width: 22px;
      flex-shrink: 0;
    }
    .item-detail { flex: 1; }
    .item-name {
      font-size: 14px;
      font-weight: bold;
      line-height: 1.3;
    }
    .extras {
      font-size: 11px;
      color: #333;
      margin-top: 1px;
    }
    .notes {
      font-size: 11px;
      color: #000;
      font-style: italic;
      margin-top: 2px;
      padding: 2px 3px;
      border-left: 2px solid #000;
    }

    /* ── Footer ── */
    .footer {
      border-top: 2px dashed #000;
      padding-top: 5px;
      margin-top: 8px;
      text-align: center;
      font-size: 11px;
      color: #555;
    }

    /* ── Print media ── */
    @media print {
      body { width: 80mm; }
      @page {
        size: 80mm auto;
        margin: 0;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="restaurant-name">🍕 Piacere</div>
    <div class="ticket-title">— COCINA —</div>
  </div>

  <div class="order-number">${order.order_number}</div>
  <div class="type-badge">${typeLabel}${order.table_name ? ` &nbsp;·&nbsp; Mesa: ${order.table_name}` : ''}</div>

  <div class="meta">
    <div class="meta-row">
      <span class="label">Orden creada:</span>
      <span class="value">${orderDate}</span>
    </div>
    <div class="meta-row">
      <span class="label">Impreso a las:</span>
      <span class="value">${printTime}</span>
    </div>
    ${order.customer_name ? `<div class="meta-row"><span class="label">Cliente:</span><span class="value">${order.customer_name}</span></div>` : ''}
  </div>

  <div class="items-title">PRODUCTOS</div>
  ${itemsHtml}

  <div class="footer">
    *** ${order.items.length} ítem(s) en total ***<br/>
    Imprimido desde el sistema POS
  </div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=400,height=600,toolbar=0,menubar=0,location=0');
  if (!win) {
    alert('Por favor permite las ventanas emergentes para imprimir el ticket de cocina.');
    return;
  }

  win.document.open();
  win.document.write(html);
  win.document.close();

  // Give the browser time to render before printing
  win.onload = () => {
    win.focus();
    win.print();
    // Close the window after printing (optional, comment out if user wants to see ticket)
    win.onafterprint = () => win.close();
  };
}
