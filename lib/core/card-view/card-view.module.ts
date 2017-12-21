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

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule, MatDatepickerModule, MatIconModule, MatInputModule, MatNativeDateModule } from '@angular/material';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TranslateModule } from '@ngx-translate/core';

import { CardViewContentProxyDirective } from './directives/card-view-content-proxy.directive';
import { CardViewDateItemComponent } from './components/card-view-dateitem/card-view-dateitem.component';
import { CardViewItemDispatcherComponent } from './components/card-view-item-dispatcher/card-view-item-dispatcher.component';
import { CardViewMapItemComponent } from './components/card-view-mapitem/card-view-mapitem.component';
import { CardViewTextItemComponent } from './components/card-view-textitem/card-view-textitem.component';
import { CardViewComponent } from './components/card-view/card-view.component';

import { CardItemTypeService } from './services/card-item-types.service';
import { CardViewUpdateService } from './services/card-view-update.service';

@NgModule({
    imports: [
        CommonModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        FormsModule,
        FlexLayoutModule,
        TranslateModule
    ],
    declarations: [
        CardViewComponent,
        CardViewItemDispatcherComponent,
        CardViewContentProxyDirective,
        CardViewTextItemComponent,
        CardViewMapItemComponent,
        CardViewDateItemComponent
    ],
    entryComponents: [
        CardViewTextItemComponent,
        CardViewMapItemComponent,
        CardViewDateItemComponent
    ],
    exports: [
        CardViewComponent,
        CardViewTextItemComponent,
        CardViewMapItemComponent,
        CardViewDateItemComponent
    ],
    providers: [
        CardItemTypeService,
        CardViewUpdateService
    ]
})
export class CardViewModule {}
