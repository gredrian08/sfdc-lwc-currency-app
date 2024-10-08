/**
 * @author            : gredrianc
 * @last modified on  : 2024-09-22
 * @last modified by  : gredrianc
**/
import { LightningElement } from 'lwc';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import checkConnection from '@salesforce/apex/CurrencyAPIConnector.checkConnection';
import getExchangeRate from '@salesforce/apex/CurrencyAPIConnector.getExchangeRate';
import { track } from 'lwc';


export default class CurrencyApp extends LightningElement {

    isProcessing = true;
    isProcessed;
    
    isConverted;
    isHistorical =false;

    options = [];
    amount;
    fromCurrency;
    toCurrency;

    convertedAmount;
    currencyCode;

    formattedDate = new Date().toLocaleDateString('en-CA');
    @track historicalDate;
    

    connectedCallback() {
        checkConnection()
            .then(results=>{
                let option = [];
                let result = JSON.parse(results);
                for(const code in result.data) {
                    option.push({label: result.data[code].code + ' - ' + result.data[code].name, value: result.data[code].code});
                }
                this.options = [...option];
                this.isProcessing = false;
            })
            .catch(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Connection Failed',
                        message: 'Error with retreiving currencies.',
                        variant: 'error'
                    })
                );
            })
            .finally(() => {
                this.isProcessed = true;
            });
    }


    handleAmount(event) {
        this.amount = event.detail.value;
    }

    handleFromChange(event) {
        this.fromCurrency = event.detail.value;
    }

    handleToChange(event) {
        this.toCurrency = event.detail.value;
        this.currencyCode = event.detail.value;
    }

    get disableButton() {
        return !(this.amount && this.fromCurrency && this.toCurrency);
    }

    handleClick(event) {
        [this.fromCurrency, this.toCurrency] =  [this.toCurrency, this.fromCurrency];
        this.currencyCode = this.toCurrency;
        this.convertedAmount ='';
        this.isConverted = false;
    }

    handleEditDate(event) {
        this.isHistorical = true;
        this.historicalDate = this.formattedDate;
    }

    handleDateChange(event){
        this.historicalDate = event.detail.value;
    }

    handleConversion(event) {
        const type = this.isHistorical === false || new Date(this.historicalDate) >= new Date(this.formattedDate) ? "latest" : "historical";
        const params = type === "latest" 
            ? { base_currency: this.fromCurrency, currencies: this.toCurrency }
            : { date: this.historicalDate, base_currency: this.fromCurrency, currencies: this.toCurrency };
    
        this.getExchangeRateAndConvert(type, params);
        this.isConverted = false;

    }

    async getExchangeRateAndConvert(requestType,urlParam) {
        getExchangeRate({requestType, urlParam})
        .then(results => {
            let result = JSON.parse(results);
            this.convertedAmount = this.amount * result.data[this.toCurrency].value;
        })
        .catch(error => {
            console.log(error);
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: error.body.message,
                    variant: 'error'
                })
            );
        })
        .finally(() => {
            this.isConverted = true;
        });

    }


}