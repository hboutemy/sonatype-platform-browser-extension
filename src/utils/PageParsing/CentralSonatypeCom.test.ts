/*
 * Copyright (c) 2019-present Sonatype, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { describe, expect, test } from '@jest/globals'
import { readFileSync } from 'fs'
import { PackageURL } from 'packageurl-js'
import { join } from 'path'
import { FORMATS, REPOS, REPO_TYPES } from '../Constants'
import { getArtifactDetailsFromDOM } from '../PageParsing'
import { ensure } from '../Helpers'

describe('central.sonatype.com Page Parsing', () => {
    const repoType = REPO_TYPES.find((e) => e.repoID == REPOS.centralSonatypeCom)
    expect(repoType).toBeDefined()

    test('should parse a valid central.sonatype.com page', () => {
        const html = readFileSync(join(__dirname, 'testdata/CentralSonatypeCom.html'))

        window.document.body.innerHTML = html.toString()

        const packageURL: PackageURL | undefined = getArtifactDetailsFromDOM(
            ensure(repoType),
            'https://central.sonatype.com/artifact/org.cyclonedx/cyclonedx-core-java/7.3.2'
        )

        expect(packageURL).toBeDefined()
        expect(packageURL?.type).toBe('maven')
        expect(packageURL?.namespace).toBe('org.cyclonedx')
        expect(packageURL?.name).toBe('cyclonedx-core-java')
        expect(packageURL?.version).toBe('7.3.2')
    })

    test('should parse a valid central.sonatype.com page with additional path', () => {
        const html = readFileSync(join(__dirname, 'testdata/CentralSonatypeCom.html'))

        window.document.body.innerHTML = html.toString()

        const packageURL: PackageURL | undefined = getArtifactDetailsFromDOM(
            ensure(repoType),
            'https://central.sonatype.com/artifact/org.cyclonedx/cyclonedx-core-java/7.3.2/versions'
        )

        expect(packageURL).toBeDefined()
        expect(packageURL?.type).toBe('maven')
        expect(packageURL?.namespace).toBe('org.cyclonedx')
        expect(packageURL?.name).toBe('cyclonedx-core-java')
        expect(packageURL?.version).toBe('7.3.2')
    })

    test('should parse a valid central.sonatype.com page with additional path and query string', () => {
        const html = readFileSync(join(__dirname, 'testdata/CentralSonatypeCom.html'))

        window.document.body.innerHTML = html.toString()

        const packageURL: PackageURL | undefined = getArtifactDetailsFromDOM(
            ensure(repoType),
            'https://central.sonatype.com/artifact/org.cyclonedx/cyclonedx-core-java/7.3.2/versions?something=else'
        )

        expect(packageURL).toBeDefined()
        expect(packageURL?.type).toBe('maven')
        expect(packageURL?.namespace).toBe('org.cyclonedx')
        expect(packageURL?.name).toBe('cyclonedx-core-java')
        expect(packageURL?.version).toBe('7.3.2')
    })

    test('should parse a valid central.sonatype.com page with additional path and fragment', () => {
        const html = readFileSync(join(__dirname, 'testdata/CentralSonatypeCom.html'))

        window.document.body.innerHTML = html.toString()

        const packageURL: PackageURL | undefined = getArtifactDetailsFromDOM(
            ensure(repoType),
            'https://central.sonatype.com/artifact/org.cyclonedx/cyclonedx-core-java/7.3.2/versions#anchor'
        )

        expect(packageURL).toBeDefined()
        expect(packageURL?.type).toBe('maven')
        expect(packageURL?.namespace).toBe('org.cyclonedx')
        expect(packageURL?.name).toBe('cyclonedx-core-java')
        expect(packageURL?.version).toBe('7.3.2')
    })
})
