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

import { Injectable } from '@angular/core';
import { AspectsApi } from '../spike/aspects-api.service';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class PropertyDescriptorLoaderService {

    constructor(private aspectsApi: AspectsApi) {}

    load(aspects: string[]): Observable<any> {
        const aspectFetchStreams = aspects.map((aspect) => this.aspectsApi.fetchAspect(aspect));

        return forkJoin(aspectFetchStreams)
            .map(this.flattenResponse);
    }

    private flattenResponse(aspects) {
        const properties = [];

        aspects.forEach((aspectObject) => {
            const aspectName = aspectObject.name;
            const aspectPropertyNames = Object.keys(aspectObject.properties);

            aspectPropertyNames.forEach((propertyName) => {
                const property = aspectObject.properties[propertyName];
                property.aspectName = aspectName;
                properties.push(property);
            });
        });

        return properties;
    }
}