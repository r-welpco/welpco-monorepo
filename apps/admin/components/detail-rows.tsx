import { Table, TableBody, TableCell, TableRow, TableRowHeaderCell, Text } from "@welpco/ui";

export function DetailTable({ children }: { children: React.ReactNode }) {
  return (
    <Table variant="surface">
      <TableBody>{children}</TableBody>
    </Table>
  );
}

export function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <TableRow>
      <TableRowHeaderCell style={{ width: "40%", verticalAlign: "top" }}>
        <Text size="1" color="gray">
          {label}
        </Text>
      </TableRowHeaderCell>
      <TableCell>{children}</TableCell>
    </TableRow>
  );
}
