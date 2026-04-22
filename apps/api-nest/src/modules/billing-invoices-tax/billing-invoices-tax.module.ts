import { Module } from '@nestjs/common';
import { BillingInvoicesTaxController, BillingInvoicesTaxWebhookController } from './billing-invoices-tax.controller';
import { BillingInvoicesTaxService } from './billing-invoices-tax.service';
import { BillingInvoicesTaxRepository } from './billing-invoices-tax.repository';

@Module({
  controllers: [BillingInvoicesTaxController, BillingInvoicesTaxWebhookController],
  providers: [BillingInvoicesTaxService, BillingInvoicesTaxRepository],
  exports: [BillingInvoicesTaxService],
})
export class BillingInvoicesTaxModule {}
