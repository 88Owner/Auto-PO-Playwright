import { test, expect } from '@playwright/test';
import XLSX from 'xlsx';

function readExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  return rows
    .slice(1)
    .map(row => ({
      sku: row[0],
      quantity: row[1],
    }))
    .filter(r => r.sku && r.quantity);
}

test.use({
  storageState: 'auth.json',
});

test('Auto Create PO - Mỗi dòng 1 đơn', async ({ page }) => {
  test.setTimeout(120_000);

  const data = readExcel('./data.xlsx');

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
    await skuInput.fill(item.sku);

    // Đợi list gợi ý mở ra & chọn đúng SKU
    const skuOption = page.getByRole('option', {
      name: new RegExp(`SKU:\\s*${item.sku}\\b`),
    });
    await expect(skuOption).toBeVisible();
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

    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    await page.waitForLoadState('networkidle');
  }
});