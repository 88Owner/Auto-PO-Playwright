import { test, expect } from '@playwright/test';
import XLSX from 'xlsx';

function readExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  return rows
    .slice(1)
    .map(row => ({
      sku: row[0] != null ? String(row[0]).trim() : '',
      quantity: row[1],
    }))
    .filter(r => r.sku && r.quantity);
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findInventoryItemBySku(payload, sku) {
  if (!payload || typeof payload !== 'object') return null;

  const items = Array.isArray(payload.inventory_items)
    ? payload.inventory_items
    : Array.isArray(payload.inventoryItems)
      ? payload.inventoryItems
      : Array.isArray(payload.items)
        ? payload.items
        : null;

  if (!items) return null;

  const normalizedSku = String(sku).trim();
  return (
    items.find(it => String(it?.sku ?? '').trim() === normalizedSku) ??
    items.find(it => String(it?.code ?? '').trim() === normalizedSku) ??
    null
  );
}

test.use({
  storageState: process.env.AUTH_STATE_FILE || 'auth.json',
});

test('Auto Create PO - Mỗi dòng 1 đơn', async ({ page }) => {
  const data = readExcel('./data.xlsx');
  // Không giới hạn timeout cho bài test này.
  test.setTimeout(0);

  for (const item of data) {
    console.log(`Đang tạo PO cho SKU: ${item.sku}`);

    await page.goto('https://tinhtra.mysapo.net/admin/dashboard');

    await page.getByRole('link', { name: 'Quản lý kho' }).click();
    await page.getByRole('link', { name: 'Đặt hàng nhập' }).click();
    await page.getByRole('link', { name: 'Tạo đơn đặt hàng' }).click();

    // ===== Nhập SKU =====
    const skuInput = page.getByRole('textbox', {
      name: /Tìm theo tên, mã SKU, quét mã Barcode/i,
    });
    const waitInventoryItems = page.waitForResponse(
      (res) =>
        res.ok() &&
        res.request().method() === 'GET' &&
        /inventory_items/i.test(res.url()),
      { timeout: 30_000 }
    );

    await skuInput.fill(item.sku);

    // Ưu tiên lấy đúng SKU từ API inventory_items (ổn định khi dropdown có nhiều kết quả).
    let apiMatchedSku = null;
    try {
      const res = await waitInventoryItems;
      const json = await res.json().catch(() => null);
      const matched = findInventoryItemBySku(json, item.sku);
      apiMatchedSku = matched?.sku ? String(matched.sku).trim() : null;
    } catch {
      // Nếu không bắt được response (hoặc JSON khác format), fallback sang locator theo text bên dưới.
    }

    const skuToClick = apiMatchedSku || item.sku;
    const skuEscaped = escapeRegExp(String(skuToClick).trim());

    // Chọn option có đúng SKU (tránh dính các biến thể kiểu -RG2).
    const skuOption = page.getByRole('option', {
      name: new RegExp(`SKU:\\s*${skuEscaped}(\\s*\\||\\s*$)`),
    });
    await expect(skuOption).toBeVisible({ timeout: 30_000 });
    await skuOption.click();

    // ===== Chờ row SKU xuất hiện trong bảng sản phẩm =====
    const row = page.getByRole('row', { name: new RegExp(item.sku) });
    await expect(row).toBeVisible({ timeout: 15_000 });

    // ===== Nhập số lượng (từ file Excel) =====
    const quantityInput = row.getByRole('textbox'); // ô "1" trong snapshot
    await expect(quantityInput).toBeVisible();
    await quantityInput.fill(''); // clear giá trị mặc định "1"
    await quantityInput.fill(item.quantity.toString());

    // ===== Chọn nhà cung cấp =====
    await page
      .getByRole('combobox', {
        name: /Tìm theo tên, SĐT, mã NCC/i,
      })
      .click();

    await page
      .locator('div')
      .filter({ hasText: /^Shisonson$/ })
      .nth(2)
      .click();

    // ===== Tạo & duyệt đơn =====
    const submitButton = page
      .locator('#AppFrameScrollable')
      .getByRole('button', { name: 'Tạo & duyệt đơn đặt hàng' });

    await submitButton.scrollIntoViewIfNeeded();
    await expect(submitButton).toBeVisible({ timeout: 30_000 });
    await expect(submitButton).toBeEnabled({ timeout: 30_000 });
    // Click đôi khi fail vì overlay/DOM re-render; retry nhẹ.
    await submitButton.click({ timeout: 30_000, trial: true }).catch(() => {});
    await submitButton.click({ timeout: 30_000 });

    await page.waitForLoadState('networkidle');
  }
});