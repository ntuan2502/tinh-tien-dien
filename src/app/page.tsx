"use client";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  getKeyValue,
  Form,
  Input,
  Button,
} from "@nextui-org/react";
import { useState, useEffect } from "react";

// Kiểu dữ liệu cho từng bậc
interface Row {
  key: number;
  range: string;
  count: number | null;
  after: number;
}

const rows: Row[] = [
  {
    key: 1,
    range: "0 - 50 kWh",
    count: 50,
    after: 1893,
  },
  {
    key: 2,
    range: "50 - 100 kWh",
    count: 50,
    after: 1956,
  },
  {
    key: 3,
    range: "101 - 200 kWh",
    count: 100,
    after: 2271,
  },
  {
    key: 4,
    range: "201 - 300 kWh",
    count: 100,
    after: 2860,
  },
  {
    key: 5,
    range: "301 - 400 kWh",
    count: 100,
    after: 3197,
  },
  {
    key: 6,
    range: "> 401 kWh",
    count: null, // count có thể là null
    after: 3302,
  },
];

// Kiểu dữ liệu cho chi tiết tiền theo từng bậc
interface BillDetail {
  range: string;
  afterAmount: number;
  beforeVatAmount: number; // Tiền chưa tính VAT
  vatAmount: number;
  formattedAfterAmount: string;
  formattedBeforeVatAmount: string;
  formattedVatAmount: string;
}

const columns = [
  {
    key: "key",
    label: "Bậc",
  },
  {
    key: "range",
    label: "Mức sử dụng",
  },
  {
    key: "count",
    label: "SL tối đa",
  },
  {
    key: "after",
    label: "Từ ngày 11/10/2024",
  },
];

export default function App() {
  const [submitted, setSubmitted] = useState<{ [key: string]: string } | null>(
    null
  );
  const [totalAmountAfter, setTotalAmountAfter] = useState<number | null>(null);
  const [totalAmountBeforeVat, setTotalAmountBeforeVat] = useState<
    number | null
  >(null); // Tổng tiền chưa tính VAT
  const [totalVatAmount, setTotalVatAmount] = useState<number | null>(null); // Tổng VAT phải trả
  const [bills, setBills] = useState<BillDetail[]>([]);
  const [startIndex, setStartIndex] = useState<number | null>(null); // Chỉ số đầu
  const [endIndex, setEndIndex] = useState<number | null>(null); // Chỉ số cuối
  const [vat, setVat] = useState<number>(8); // % VAT, mặc định là 8%

  // Hàm định dạng tiền với dấu chấm phân cách hàng ngàn
  const formatCurrency = (value: number): string => {
    return value.toLocaleString("vi-VN");
  };

  // Dùng useEffect để tính toán khi chỉ số đầu, chỉ số cuối thay đổi
  useEffect(() => {
    if (startIndex !== null && endIndex !== null) {
      const usage = endIndex - startIndex; // Số điện tiêu thụ từ chỉ số đầu đến chỉ số cuối

      const calculateBill = (usage: number, vat: number) => {
        let totalAfter = 0;
        let totalBeforeVat = 0; // Tổng tiền điện chưa tính VAT
        let totalVat = 0; // Tổng VAT phải trả
        let remainingUsage = usage;
        const billDetails: BillDetail[] = [];

        rows.forEach((row) => {
          const count = row.count;
          const afterPrice = row.after;

          if (count === null) return;

          let afterBillForThisLevel = 0;
          let beforeVatBillForThisLevel = 0; // Tiền chưa VAT

          if (remainingUsage > count) {
            afterBillForThisLevel = count * afterPrice;
            beforeVatBillForThisLevel = count * afterPrice;
            remainingUsage -= count;
          } else if (remainingUsage > 0) {
            afterBillForThisLevel = remainingUsage * afterPrice;
            beforeVatBillForThisLevel = remainingUsage * afterPrice;
            remainingUsage = 0;
          }

          if (afterBillForThisLevel > 0) {
            const vatAmountLast = afterBillForThisLevel * (vat / 100);

            billDetails.push({
              range: row.range,
              afterAmount: afterBillForThisLevel + vatAmountLast,
              beforeVatAmount: beforeVatBillForThisLevel, // Tiền chưa tính VAT
              vatAmount: vatAmountLast,
              formattedAfterAmount: formatCurrency(
                afterBillForThisLevel + vatAmountLast
              ),
              formattedBeforeVatAmount: formatCurrency(
                beforeVatBillForThisLevel
              ),
              formattedVatAmount: formatCurrency(vatAmountLast),
            });

            totalAfter += afterBillForThisLevel + vatAmountLast;
            totalBeforeVat += beforeVatBillForThisLevel; // Cập nhật tổng tiền chưa VAT
            totalVat += vatAmountLast; // Cập nhật tổng VAT
          }
        });

        // Nếu còn điện chưa tính, sử dụng bậc cuối cùng (không có giới hạn)
        if (remainingUsage > 0) {
          const lastRow = rows[rows.length - 1];
          const afterLastLevel = remainingUsage * lastRow.after;
          const beforeVatLastLevel = remainingUsage * lastRow.after; // Tiền chưa VAT

          const vatAmountLast = afterLastLevel * (vat / 100);

          billDetails.push({
            range: "> 401 kWh",
            afterAmount: afterLastLevel + vatAmountLast,
            beforeVatAmount: beforeVatLastLevel, // Tiền chưa tính VAT
            vatAmount: vatAmountLast,
            formattedAfterAmount: formatCurrency(
              afterLastLevel + vatAmountLast
            ),
            formattedBeforeVatAmount: formatCurrency(beforeVatLastLevel),
            formattedVatAmount: formatCurrency(vatAmountLast),
          });

          totalAfter += afterLastLevel + vatAmountLast;
          totalBeforeVat += beforeVatLastLevel; // Cập nhật tổng tiền chưa VAT
          totalVat += vatAmountLast; // Cập nhật tổng VAT
        }

        return { totalAfter, totalBeforeVat, totalVat, billDetails };
      };

      const { totalAfter, totalBeforeVat, totalVat, billDetails } =
        calculateBill(usage, vat);
      setTotalAmountAfter(totalAfter);
      setTotalAmountBeforeVat(totalBeforeVat); // Cập nhật tổng tiền chưa VAT
      setTotalVatAmount(totalVat); // Cập nhật tổng VAT
      setBills(billDetails);
    }
  }, [startIndex, endIndex, vat]);

  // Hàm xử lý khi submit form
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const data: { [key: string]: string } = {};

    formData.forEach((value, key) => {
      if (typeof value === "string") {
        data[key] = value;
      }
    });

    setStartIndex(parseFloat(data.startIndex) || 0);
    setEndIndex(parseFloat(data.endIndex) || 0);
    setVat(parseFloat(data.vat) || 8); // Đảm bảo VAT luôn có giá trị mặc định là 8%
    setSubmitted(data); // Lưu lại thông tin form
  };

  return (
    <div className="m-4">
      <Form
        className="w-full my-4"
        validationBehavior="native"
        onSubmit={onSubmit}
      >
        <Input
          isRequired
          label="Chỉ số đầu"
          labelPlacement="outside"
          name="startIndex"
          placeholder="0"
          type="number"
          defaultValue="0"
          min={0}
        />
        <Input
          isRequired
          label="Chỉ số cuối"
          labelPlacement="outside"
          name="endIndex"
          placeholder="100"
          type="number"
          defaultValue="0"
          min={0}
        />
        <Input
          label="VAT (%)"
          labelPlacement="outside"
          name="vat"
          type="number"
          defaultValue="8"
          min={0}
          max={100}
        />
        <Button type="submit" variant="bordered">
          Submit
        </Button>
        {bills.length > 0 && (
          <Table aria-label="Example table with dynamic content">
            <TableHeader>
              <TableColumn>Bậc</TableColumn>
              <TableColumn>Chưa tính VAT</TableColumn>
              <TableColumn>Tiền VAT</TableColumn>
              <TableColumn>Tổng</TableColumn>
            </TableHeader>
            <TableBody items={bills}>
              {(bill) => (
                <TableRow key={bill.formattedVatAmount}>
                  <TableCell>{bill.range}</TableCell>
                  <TableCell>{bill.formattedBeforeVatAmount} VND</TableCell>
                  <TableCell>{bill.formattedVatAmount} VND</TableCell>
                  <TableCell>{bill.formattedAfterAmount} VND </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
        {submitted && (
          <div className="text-small text-default-500">
            Bạn đã nhập: <code>{JSON.stringify(submitted)}</code>
          </div>
        )}
        {totalAmountBeforeVat !== null && (
          <div className="text-small text-default-500">
            Tổng tiền điện (Chưa tính VAT):{" "}
            <strong>{formatCurrency(totalAmountBeforeVat)} VND </strong>
          </div>
        )}
        {totalVatAmount !== null && (
          <div className="text-small text-default-500">
            Tổng tiền VAT phải trả:{" "}
            <strong>{formatCurrency(totalVatAmount)} VND </strong>
          </div>
        )}
        {totalAmountAfter !== null && (
          <div className="text-small text-default-500">
            Tổng tiền điện (có VAT):{" "}
            <strong>{formatCurrency(totalAmountAfter)} VND </strong>
          </div>
        )}
      </Form>
      <Table aria-label="Example table with dynamic content">
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key}>{column.label}</TableColumn>
          )}
        </TableHeader>
        <TableBody items={rows}>
          {(item) => (
            <TableRow key={item.key}>
              {(columnKey) => (
                <TableCell>{getKeyValue(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
