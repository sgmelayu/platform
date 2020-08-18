/// <reference types="Cypress" />

import CustomerPageObject from '../../../support/pages/module/sw-customer.page-object';

let customer = {
    salutation: 'Mr.',
    country: 'Germany'
};

describe('Customer:  Visual test', () => {
    beforeEach(() => {
        cy.setToInitialState()
            .then(() => {
                cy.loginViaApi();
            })
            .then(() => {
                return cy.createCustomerFixture();
            })
            .then(() => {
                return cy.fixture('customer');
            })
            .then((result) => {
                customer = Cypress._.merge(customer, result);

                return cy.fixture('customer-address');
            })
            .then((result) => {
                customer = Cypress._.merge(customer, result);
            })
            .then(() => {
                cy.openInitialPage(`${Cypress.env('admin')}#/sw/customer/index`);
            });
    });

    it('@visual: check appearance of basic customer workflow', () => {
        const page = new CustomerPageObject();
        // Request we want to wait for later
        cy.server();
        cy.route({
            url: `${Cypress.env('apiPath')}/customer`,
            method: 'post'
        }).as('saveData');

        // Take snapshot for visual testing
        cy.takeSnapshot('Customer listing', '.sw-customer-list-grid');

        // Fill in basic data
        cy.get('a[href="#/sw/customer/create"]').click();

        // Take snapshot for visual testing
        cy.takeSnapshot('Customer create', '.sw-customer-create');

        cy.get('.sw-customer-base-form__salutation-select')
            .typeSingleSelectAndCheck('Mr.', '.sw-customer-base-form__salutation-select');

        cy.get('input[name=sw-field--customer-firstName]').type(customer.firstName);
        cy.get('input[name=sw-field--customer-lastName]').type(customer.lastName);
        cy.get(page.elements.customerMailInput).type('tester@example.com');

        cy.get('.sw-customer-base-form__customer-group-select')
            .typeSingleSelectAndCheck('Standard customer group', '.sw-customer-base-form__customer-group-select');

        cy.get('.sw-customer-base-form__sales-channel-select')
            .typeSingleSelectAndCheck('Storefront', '.sw-customer-base-form__sales-channel-select');

        cy.get('.sw-customer-base-form__payment-method-select')
            .typeSingleSelectAndCheck('Invoice', '.sw-customer-base-form__payment-method-select');

        cy.get('#sw-field--customer-password').type('shopware');

        // Fill in address and save
        page.createBasicAddress(customer);
        cy.get(page.elements.customerSaveAction).click();

        // Verify new customer in detail
        cy.wait('@saveData').then((xhr) => {
            expect(xhr).to.have.property('status', 204);
            // cy.awaitAndCheckNotification('');
        });

        // Take snapshot for visual testing
        cy.takeSnapshot('Customer create', '.sw-customer-detail');

        cy.get(`${page.elements.customerMetaData}-customer-name`)
            .contains(`${customer.firstName} ${customer.lastName}`);
        cy.get('.sw-customer-card-email-link').contains('tester@example.com');
        cy.get('.sw-customer-base__label-customer-number').contains('1');
        cy.get('.sw-address__location').contains(customer.addresses[0].zipcode);

        // Verify customer in Storefront
        cy.visit('/account/login');

        cy.get('.login-card').should('be.visible');
        cy.get('#loginMail').typeAndCheck('tester@example.com');
        cy.get('#loginPassword').typeAndCheck('shopware');
        cy.get('.login-submit [type="submit"]').click();

        cy.get('.account-welcome h1').should((element) => {
            expect(element).to.contain('Overview');
        });
        cy.contains('tester@example.com');
    });

    it('@visual: check appearance of customer address workflow', () => {
        const page = new CustomerPageObject();

        // Open customer
        cy.clickContextMenuItem(
            '.sw-customer-list__view-action',
            page.elements.contextMenuButton,
            `${page.elements.dataGridRow}--0`
        );
        cy.get(`${page.elements.customerMetaData}-customer-name`)
            .contains(`Mr. ${customer.firstName} ${customer.lastName}`);

        // Open and add new address
        cy.get('.sw-customer-detail__tab-addresses').click();

        // Take snapshot for visual testing
        cy.takeSnapshot('Customer detail - address listing', '.sw-customer-detail-addresses');

        cy.get('.sw-customer-detail__open-edit-mode-action').click();
        cy.get('.sw-customer-detail-addresses__add-address-action').click();

        // Take snapshot for visual testing
        cy.takeSnapshot('Customer detail - address modal', '.sw-modal');

        page.createBasicAddress(newAddress);
        cy.get(`${page.elements.modal} ${page.elements.primaryButton}`).click();

        // Verify updated customer
        cy.contains(`Mr. ${customer.firstName} ${customer.lastName}`);
    });
});
