/*!
 * @license
 * Copyright 2016 Alfresco Software, Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
    ViewEncapsulation,
    ChangeDetectorRef,
    OnDestroy,
    HostBinding
} from '@angular/core';

import { Pagination } from 'alfresco-js-api';
import { PaginationQueryParams } from './pagination-query-params.interface';
import { PaginatedComponent } from './paginated-component.interface';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'adf-pagination',
    host: { 'class': 'adf-pagination' },
    templateUrl: './pagination.component.html',
    styleUrls: ['./pagination.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class PaginationComponent implements OnInit, OnDestroy {

    static DEFAULT_PAGINATION: Pagination = {
        skipCount: 0,
        maxItems: 25,
        totalItems: 0
    };

    static ACTIONS = {
        NEXT_PAGE: 'NEXT_PAGE',
        PREV_PAGE: 'PREV_PAGE',
        CHANGE_PAGE_SIZE: 'CHANGE_PAGE_SIZE',
        CHANGE_PAGE_NUMBER: 'CHANGE_PAGE_NUMBER'
    };

    @Input()
    target: PaginatedComponent;

    @Input()
    supportedPageSizes: number[] = [5, 25, 50, 100];

    @Input()
    pagination: Pagination;

    @Output()
    change: EventEmitter<PaginationQueryParams> = new EventEmitter<PaginationQueryParams>();

    @Output()
    changePageNumber: EventEmitter<Pagination> = new EventEmitter<Pagination>();

    @Output()
    changePageSize: EventEmitter<Pagination> = new EventEmitter<Pagination>();

    @Output()
    nextPage: EventEmitter<Pagination> = new EventEmitter<Pagination>();

    @Output()
    prevPage: EventEmitter<Pagination> = new EventEmitter<Pagination>();

    private paginationSubscription: Subscription;

    constructor(private cdr: ChangeDetectorRef) {
    }

    ngOnInit() {
        if (this.target) {
            this.supportedPageSizes = this.target.supportedPageSizes;
            this.paginationSubscription = this.target.pagination.subscribe(page => {
                this.pagination = page;
                this.cdr.detectChanges();
            });
        }

        if (!this.pagination) {
            this.pagination = PaginationComponent.DEFAULT_PAGINATION;
        }
    }

    get lastPage(): number {
        const { maxItems, totalItems } = this.pagination;

        return (totalItems && maxItems)
            ? Math.ceil(totalItems / maxItems)
            : 1;
    }

    get current(): number {
        const { maxItems, skipCount } = this.pagination;

        return (skipCount && maxItems)
            ? Math.floor(skipCount / maxItems) + 1
            : 1;
    }

    get isLastPage(): boolean {
        return this.current === this.lastPage;
    }

    get isFirstPage(): boolean {
        return this.current === 1;
    }

    get next(): number {
        return this.isLastPage ? this.current : this.current + 1;
    }

    get previous(): number {
        return this.isFirstPage ? 1 : this.current - 1;
    }

    get hasItems(): boolean {
        return this.pagination && this.pagination.count > 0;
    }

    @HostBinding('class.adf-pagination__empty')
    get isEmpty(): boolean {
        return !this.hasItems;
    }

    get range(): number[] {
        const { skipCount, maxItems, totalItems } = this.pagination;
        const { isLastPage } = this;

        const start = totalItems ? skipCount + 1 : 0;
        const end = isLastPage ? totalItems : skipCount + maxItems;

        return [start, end];
    }

    get pages(): number[] {
        return Array(this.lastPage)
            .fill('n')
            .map((item, index) => (index + 1));
    }

    goNext() {
        if (this.hasItems) {
            const maxItems = this.pagination.maxItems;
            const skipCount = (this.next - 1) * maxItems;

            this.handlePaginationEvent(PaginationComponent.ACTIONS.NEXT_PAGE, {
                skipCount,
                maxItems
            });
        }
    }

    goPrevious() {
        if (this.hasItems) {
            const maxItems = this.pagination.maxItems;
            const skipCount = (this.previous - 1) * maxItems;

            this.handlePaginationEvent(PaginationComponent.ACTIONS.PREV_PAGE, {
                skipCount,
                maxItems
            });
        }
    }

    onChangePageNumber(pageNumber: number) {
        if (this.hasItems) {
            const maxItems = this.pagination.maxItems;
            const skipCount = (pageNumber - 1) * maxItems;

            this.handlePaginationEvent(PaginationComponent.ACTIONS.CHANGE_PAGE_NUMBER, {
                skipCount,
                maxItems
            });
        }
    }

    onChangePageSize(maxItems: number) {
        this.handlePaginationEvent(PaginationComponent.ACTIONS.CHANGE_PAGE_SIZE, {
            skipCount: 0,
            maxItems
        });
    }

    handlePaginationEvent(action: string, params: PaginationQueryParams) {
        const {
            NEXT_PAGE,
            PREV_PAGE,
            CHANGE_PAGE_NUMBER,
            CHANGE_PAGE_SIZE
        } = PaginationComponent.ACTIONS;

        const {
            change,
            changePageNumber,
            changePageSize,
            nextPage,
            prevPage,
            pagination
        } = this;

        const data = Object.assign({}, pagination, params);

        if (action === NEXT_PAGE) {
            nextPage.emit(data);
        }

        if (action === PREV_PAGE) {
            prevPage.emit(data);
        }

        if (action === CHANGE_PAGE_NUMBER) {
            changePageNumber.emit(data);
        }

        if (action === CHANGE_PAGE_SIZE) {
            changePageSize.emit(data);
        }

        change.emit(params);

        if (this.target) {
            this.target.updatePagination(params);
        }
    }

    ngOnDestroy() {
        if (this.paginationSubscription) {
            this.paginationSubscription.unsubscribe();
        }
    }
}
