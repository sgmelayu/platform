/// <reference types="Cypress" />

import MediaPageObject from '../../../support/pages/module/sw-media.page-object';
import ProductPageObject from "../../../support/pages/module/sw-product.page-object";

describe('Media: Visual tests', () => {
    beforeEach(() => {
        cy.setToInitialState()
            .then(() => {
                cy.loginViaApi();
            })
            .then(() => {
                cy.openInitialPage(`${Cypress.env('admin')}#/sw/media/index`);
            });
    });

    it('@visual: check appearance of basic media workflow', () => {
        const page = new MediaPageObject();

        // Request we want to wait for later
        cy.server();
        cy.route({
            url: `${Cypress.env('apiPath')}/_action/media/**/upload?extension=png&fileName=sw-login-background`,
            method: 'post'
        }).as('saveDataFileUpload');

        cy.route({
            url: `${Cypress.env('apiPath')}/_action/media/**/upload?extension=png&fileName=sw_logo_white`,
            method: 'post'
        }).as('saveDataUrlUpload');

        if (Cypress.isBrowser({ family: 'chromium' })) {
            page.uploadImageUsingFileUpload('img/sw-login-background.png', 'sw-login-background.png');

            cy.wait('@saveDataFileUpload').then((xhr) => {
                cy.awaitAndCheckNotification('File has been saved.');
                expect(xhr).to.have.property('status', 204);
            });
            cy.get('.sw-media-base-item__name[title="sw-login-background.png"]')
                .should('be.visible');
        }

        if (Cypress.isBrowser('firefox')) {
            // Upload medium
            cy.clickContextMenuItem(
                '.sw-media-upload-v2__button-url-upload',
                '.sw-media-upload-v2__button-context-menu'
            );
            page.uploadImageUsingUrl('http://assets.shopware.com/sw_logo_white.png');

            cy.wait('@saveDataUrlUpload').then((xhr) => {
                cy.awaitAndCheckNotification('File has been saved.');
                expect(xhr).to.have.property('status', 204);
            });
            cy.get('.sw-media-base-item__name[title="sw_logo_white.png"]')
                .should('be.visible');
        }

        // Take snapshot for visual testing
        cy.takeSnapshot('Media listing', '.sw-media-library');
    });

    it('@visual: check appearance of basic product media workflow', () => {
        const page = new ProductPageObject();

        // Request we want to wait for later
        cy.server();
        cy.route({
            url: `${Cypress.env('apiPath')}/product/*`,
            method: 'patch'
        }).as('saveProduct');

        // Open product
        cy.clickContextMenuItem(
            '.sw-entity-listing__context-menu-edit-action',
            page.elements.contextMenuButton,
            `${page.elements.dataGridRow}--0`
        );

        // Add first image to product
        cy.get('.sw-product-media-form__previews').scrollIntoView();
        cy.fixture('img/sw-login-background.png').then(fileContent => {
            cy.get('#files').upload(
                {
                    fileContent,
                    fileName: 'sw-login-background.png',
                    mimeType: 'image/png'
                }, {
                    subjectType: 'input'
                }
            );
        });
        cy.get('.sw-product-image__image img')
            .should('have.attr', 'src')
            .and('match', /sw-login-background/);
        cy.awaitAndCheckNotification('File has been saved.');

        // Take snapshot for visual testing
        cy.takeSnapshot('Product with image', '.sw-product-image__image');

        // Save product
        cy.get(page.elements.productSaveAction).click();
        cy.wait('@saveProduct').then((xhr) => {
            expect(xhr).to.have.property('status', 204);
        });

        // Verify in storefront
        cy.visit('/');
        cy.get('.product-name').click();
        cy.get('.gallery-slider-item').should('be.visible');
        cy.get('#tns2-item0 img')
            .should('have.attr', 'src')
            .and('match', /sw-login-background/);

        // Take snapshot for visual testing
        cy.takeSnapshot('Product in Storefront with image', '.gallery-slider-item');
    });
});
