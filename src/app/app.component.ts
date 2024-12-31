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
    const target: DataTransfer = <DataTransfer>(event.target);
    if (target.files.length !== 1) {
      console.error('Cannot upload multiple files.');
      return;
    }

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const binaryData: string = e.target.result;
      const workbook: XLSX.WorkBook = XLSX.read(binaryData, { type: 'binary' });

      // Assuming data is in the first sheet
      const sheetName: string = workbook.SheetNames[0];
      const sheet: XLSX.WorkSheet = workbook.Sheets[sheetName];

      // Parse the sheet and store the data
      const rawData: any = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      this.data = rawData.filter((row: any[]) => this.isValidDate(row[0])).filter((row: any[]) => row.length === 7);
      this.data.pop();
      console.log(this.data); // View the parsed data
    };

    reader.readAsBinaryString(target.files[0]);
  }

  // Helper function to check if a value is a valid date
  isValidDate(value: any): boolean {
    const date = new Date(value);
    return !isNaN(date.getTime()); // Checks if the date is valid
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
