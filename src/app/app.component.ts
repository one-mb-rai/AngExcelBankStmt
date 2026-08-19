import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import * as XLSX from 'xlsx';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  data: any[] = []; // Will store the parsed data
  headers = ["Date", "Narration", "Chq./Ref.No.", "Value Dt", "Withdrawal Amt.", "Deposit Amt.", "Closing Balance"];
  filterText: string = '';

  onFileChange(event: any): void {
    const target = event?.target as HTMLInputElement | null;
    const file = target?.files?.[0];

    if (!file) {
      console.error('No file selected.');
      return;
    }

    const allowedExtensions = ['.csv', '.xls', '.xlsx'];
    const fileName = file.name.toLowerCase();
    const isAllowedFile = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!isAllowedFile) {
      console.error('Unsupported file type selected:', file.name);
      return;
    }

    console.log('Selected file:', file.name, 'size:', file.size);

    const reader: FileReader = new FileReader();
    reader.onerror = () => {
      console.error('FileReader failed while reading the selected file.', reader.error);
    };

    reader.onload = (e: any) => {
      try {
        const fileData: ArrayBuffer | string = e.target?.result ?? '';
        if (!fileData) {
          console.error('File content is empty.');
          return;
        }

        const workbook: XLSX.WorkBook = XLSX.read(fileData, {
          type: 'array',
          cellDates: true,
          raw: false,
        });

        console.log('Workbook sheets:', workbook.SheetNames);

        const sheetName: string = workbook.SheetNames[0];
        const sheet: XLSX.WorkSheet = workbook.Sheets[sheetName];
        const rawData: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
        console.log('Raw parsed rows:', rawData);

        this.data = rawData
          .filter((row: any[]) => Array.isArray(row) && row.length > 0)
          .filter((row: any[]) => this.isValidDate(row[0]))
          .filter((row: any[]) => row.length === 7);

        if (this.data.length && this.data[this.data.length - 1].every((cell: any) => !cell)) {
          this.data.pop();
        }

        console.log('Filtered statement rows:', this.data);
      } catch (error) {
        console.error('Unable to parse the selected bank statement.', error);
      }
    };

    reader.readAsArrayBuffer(file);
  }

  isValidDate(value: any): boolean {
    if (value === null || value === undefined || value === '') {
      return false;
    }

    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  filteredRows() {
    if (!this.filterText) {
      return this.data;
    }
    return this.data.filter(row =>
      row.some((cell: any) => cell.toString().toLowerCase().includes(this.filterText.toLowerCase()))
    );
  }

  totalWithdrawlAmt() {
    return this.filteredRows().reduce((acc, row) => {
      const value = parseFloat(row[4]);
      return acc + (isNaN(value) ? 0 : value);
    }, 0);
  }

  totalDepositAmt() {
    return this.filteredRows().reduce((acc, row) => {
      const value = parseFloat(row[5]);
      return acc + (isNaN(value) ? 0 : value);
    }, 0);
  }
}
