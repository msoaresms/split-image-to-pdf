// © 2025 Matheus Soares da Silva
// Licenciado sob CC BY-NC-SA 4.0
// Proibida a reprodução comercial ou redistribuição não autorizada.

import { CommonModule } from '@angular/common';
import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-root',
  imports: [MatButtonModule, CommonModule, MatGridListModule, MatCardModule, ReactiveFormsModule, MatSelectModule, MatInputModule, MatFormFieldModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  public file: File | null = null;
  public imageParts: any = [];
  public imagePreview: string | null = null;
  public numRows = 2;
  public numCols = 2;
  private reader = new FileReader();
  public image: HTMLImageElement | null = null;
  @ViewChildren('canvas') canvas!: QueryList<ElementRef<HTMLCanvasElement>>;

  public form = new FormGroup({
    numCols: new FormControl('2'),
    numRows: new FormControl('2')
  })

  public ngOnInit(): void {
    this.readerOnLoad();
    this.onFormChange();
  }

  public ngAfterViewInit(): void {
    this.canvas.changes.subscribe(() => {
      this.canvas.forEach((canvasRef, index) => {
        this.drawImagePart(canvasRef.nativeElement, this.imageParts[index]);
      })
    })
  }

  public onFileSelected(event: any): void {
    this.file = event.target.files[0];
    if (this.file) {
      this.reader.readAsDataURL(this.file);
      setTimeout(() => {
        this.splitImage();
      }, 500)
    }
  }

  public splitImage(): void {
    if (!this.image) return;

    const partWidth = this.image.width / this.numCols;
    const partHeight = this.image.height / this.numRows;
    this.imageParts = [];

    for (let row = 0; row < this.numRows; row++) {
      for (let col = 0; col < this.numCols; col++) {
        this.imageParts.push({
          sx: col * partWidth,
          sy: row * partHeight,
          sw: partWidth,
          sh: partHeight,
          width: partWidth / 2,
          height: partHeight / 2
        });
      }
    }
  }

  public drawImagePart(canvas: HTMLCanvasElement, part: any): void {
    if (!this.image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = part.width;
    canvas.height = part.height;
    ctx.drawImage(this.image, part.sx, part.sy, part.sw, part.sh, 0, 0, part.width, part.height);
  }

  public exportToPDF(): void {
    const pdf = new jsPDF();
    const margin = 10

    this.canvas.forEach((canvasRef, index) => {
      const canvas = canvasRef.nativeElement;
      const imgData = canvas.toDataURL('image/png');

      const pdfWidth = pdf.internal.pageSize.getWidth() - 2 * margin;
      const pdfHeight = pdf.internal.pageSize.getHeight() - 2 * margin;

      if (index > 0) {
        pdf.addPage();
      }

      const imageProps = pdf.getImageProperties(imgData);
      const imageRatio = imageProps.width / imageProps.height;
      let renderWidth = pdfWidth;
      let renderHeight = pdfHeight;

      if (pdfWidth / pdfHeight > imageRatio) {
        renderWidth = pdfHeight * imageRatio;
      } else {
        renderHeight = pdfWidth / imageRatio;
      }

      const x = (pdf.internal.pageSize.getWidth() - renderWidth) / 2;
      const y = (pdf.internal.pageSize.getHeight() - renderHeight) / 2;

      pdf.addImage(imgData, 'PNG', x, y, renderWidth, renderHeight);
    })

    pdf.save('split-image.pdf');
  }

  private readerOnLoad() {
    this.reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.image = img;
      }
      img.src = e.target?.result as string;
      this.imagePreview = img.src;
    }
  }

  private onFormChange() {
    this.form.valueChanges.subscribe(() => {
      this.numRows = parseInt(this.form.controls.numRows.value || '2');
      this.numCols = parseInt(this.form.controls.numCols.value || '2');
      this.splitImage();
    })
  }
}
