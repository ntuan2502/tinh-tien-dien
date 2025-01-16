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
  before: number;
  after: number;
}

const rows: Row[] = [
  {
    key: 1,
    range: "0 - 50 kWh",
    count: 50,
    before: 1806,
    after: 1893,
  },
  {
    key: 2,
    range: "50 - 100 kWh",
    count: 50,
    before: 1866,
    after: 1956,
  },
  {
    key: 3,
    range: "101 - 200 kWh",
    count: 100,
    before: 2167,
    after: 2271,
  },
  {
    key: 4,
    range: "201 - 300 kWh",
    count: 100,
    before: 2729,
    after: 2860,
  },
  {
    key: 5,
    range: "301 - 400 kWh",
    count: 100,
    before: 3050,
    after: 3197,
  },
  {
    key: 6,
    range: "> 401 kWh",
    count: null, // count có thể là null
    before: 3151,
    after: 3302,
  },
];

// Kiểu dữ liệu cho chi tiết tiền theo từng bậc
interface BillDetail {
  range: string;
  beforeAmount: number;
  afterAmount: number;
  formattedBeforeAmount: string;
  formattedAfterAmount: string;
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
    key: "before",
    label: "Trước ngày 11/10/2024",
  },
  {
    key: "after",
    label: "Từ ngày 11/10/2024",
  },
];

export default function App() {
  const [submitted, setSubmitted] = useState<any>(null);
  const [totalAmountBefore, setTotalAmountBefore] = useState<number | null>(
    null
  ); // Tổng tiền theo before
  const [totalAmountAfter, setTotalAmountAfter] = useState<number | null>(null); // Tổng tiền theo after
  const [bills, setBills] = useState<BillDetail[]>([]); // Chi tiết tiền theo từng bậc
  const [usage, setUsage] = useState<number | null>(null); // Số điện đã nhập

  // Hàm định dạng tiền với dấu chấm phân cách hàng ngàn
  const formatCurrency = (value: number): string => {
    return value.toLocaleString("vi-VN"); // Định dạng theo quy tắc Việt Nam
  };

  // Hàm tính toán tiền theo từng bậc
  const calculateBill = (
    usage: number
  ): {
    totalBefore: number;
    totalAfter: number;
    billDetails: BillDetail[];
  } => {
    let totalBefore = 0;
    let totalAfter = 0;
    let remainingUsage = usage;
    const billDetails: BillDetail[] = [];

    rows.forEach((row) => {
      const count = row.count;
      const beforePrice = row.before;
      const afterPrice = row.after;

      if (count === null) return; // Bỏ qua bậc có count là null

      let beforeBillForThisLevel = 0;
      let afterBillForThisLevel = 0;

      if (remainingUsage > count) {
        beforeBillForThisLevel = count * beforePrice;
        afterBillForThisLevel = count * afterPrice;
        remainingUsage -= count;
      } else if (remainingUsage > 0) {
        beforeBillForThisLevel = remainingUsage * beforePrice;
        afterBillForThisLevel = remainingUsage * afterPrice;
        remainingUsage = 0;
      }

      if (beforeBillForThisLevel > 0 || afterBillForThisLevel > 0) {
        billDetails.push({
          range: row.range,
          beforeAmount: beforeBillForThisLevel,
          afterAmount: afterBillForThisLevel,
          formattedBeforeAmount: formatCurrency(beforeBillForThisLevel),
          formattedAfterAmount: formatCurrency(afterBillForThisLevel),
        });

        totalBefore += beforeBillForThisLevel;
        totalAfter += afterBillForThisLevel;
      }
    });

    // Nếu còn điện chưa tính, sử dụng bậc cuối cùng (không có giới hạn)
    if (remainingUsage > 0) {
      const lastRow = rows[rows.length - 1];
      const beforeLastLevel = remainingUsage * lastRow.before;
      const afterLastLevel = remainingUsage * lastRow.after;

      billDetails.push({
        range: "> 401 kWh",
        beforeAmount: beforeLastLevel,
        afterAmount: afterLastLevel,
        formattedBeforeAmount: formatCurrency(beforeLastLevel),
        formattedAfterAmount: formatCurrency(afterLastLevel),
      });

      totalBefore += beforeLastLevel;
      totalAfter += afterLastLevel;
    }

    return { totalBefore, totalAfter, billDetails };
  };

  // Dùng useEffect để tính toán khi số điện thay đổi
  useEffect(() => {
    if (usage !== null) {
      const { totalBefore, totalAfter, billDetails } = calculateBill(usage);
      setTotalAmountBefore(totalBefore);
      setTotalAmountAfter(totalAfter);
      setBills(billDetails);
    }
  }, [usage]);

  // Hàm xử lý khi submit form
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    // Lấy dữ liệu từ form và ép kiểu string cho trường hợp là chuỗi
    const data: { [key: string]: string } = {};
    formData.forEach((value, key) => {
      if (typeof value === "string") {
        data[key] = value;
      }
    });

    // Chuyển đổi số điện từ string sang number
    const usageValue = parseFloat(data.number);
    setUsage(usageValue); // Cập nhật giá trị usage và tính toán hóa đơn
    setSubmitted(data); // Lưu lại thông tin form
  };

  return (
    <div className="m-4">
      <Form
        className="w-full max-w-xs my-4"
        validationBehavior="native"
        onSubmit={onSubmit}
      >
        <Input
          isRequired
          errorMessage="Nhập vào số điện"
          label="Số điện"
          labelPlacement="outside"
          name="number"
          placeholder="100"
          min={0}
          defaultValue="0"
          type="number"
        />
        <Button type="submit" variant="bordered">
          Submit
        </Button>
        {submitted && (
          <div className="text-small text-default-500">
            Bạn đã nhập: <code>{JSON.stringify(submitted)}</code>
          </div>
        )}
        {totalAmountBefore !== null && (
          <div className="text-small text-default-500">
            Tổng tiền điện (Trước 11/10/2024):{" "}
            <strong>{formatCurrency(totalAmountBefore)} VND </strong>
          </div>
        )}
        {totalAmountAfter !== null && (
          <div className="text-small text-default-500">
            Tổng tiền điện (Từ 11/10/2024):{" "}
            <strong>{formatCurrency(totalAmountAfter)} VND </strong>
          </div>
        )}
        {bills.length > 0 && (
          <div className="text-small text-default-500 mt-4">
            <h3>Chi tiết tiền theo từng bậc:</h3>
            <ul>
              {bills.map((bill, index) => (
                <li key={index} className="my-2">
                  {bill.range}:
                  <br />
                  Trước 11/10/2024:{" "}
                  <strong>{bill.formattedBeforeAmount} VND </strong>
                  <br />
                  Từ 11/10/2024:{" "}
                  <strong>{bill.formattedAfterAmount} VND </strong>
                </li>
              ))}
            </ul>
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
