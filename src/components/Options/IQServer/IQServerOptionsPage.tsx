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

import {
    NxFormGroup,
    NxGrid,
    NxStatefulErrorAlert,
    NxStatefulSuccessAlert,
    NxStatefulTextInput,
    NxTooltip,
    NxFontAwesomeIcon,
    NxFormSelect,
    NxButton,
    NxStatefulInfoAlert,
} from '@sonatype/react-shared-components'
import React, { useEffect, useState, useContext } from 'react'
import './IQServerOptionsPage.css'
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'

import { MESSAGE_REQUEST_TYPE, MESSAGE_RESPONSE_STATUS, MessageResponse } from '../../../types/Message'
import { DEFAULT_EXTENSION_SETTINGS, ExtensionConfiguration } from '../../../types/ExtensionConfiguration'
import { ExtensionConfigurationContext } from '../../../context/ExtensionConfigurationContext'
import { isHttpUriValidator, nonEmptyValidator } from '../../Common/Validators'
import { logger, LogLevel } from '../../../logger/Logger'
import { ApiApplicationDTO } from '@sonatype/nexus-iq-api-client'

// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-explicit-any
const _browser: any = chrome ? chrome : browser

export interface IqServerOptionsPageInterface {
    setExtensionConfig: (settings: ExtensionConfiguration) => void
}

export default function IQServerOptionsPage(props: IqServerOptionsPageInterface) {
    const extensionSettings = useContext(ExtensionConfigurationContext)
    const [hasPermissions, setHasPermission] = useState(false)
    const [iqAuthenticated, setIqAuthenticated] = useState<boolean | undefined>()
    const [iqServerApplicationList, setiqServerApplicationList] = useState<Array<ApiApplicationDTO>>([])
    const setExtensionConfig = props.setExtensionConfig

    /**
     * Hook to check whether we already have permissions to IQ Server Host
     */
    useEffect(() => {
        if (extensionSettings.host !== undefined) {
            hasOriginPermission()
        }
    })

    /**
     * Request permission to IQ Server Host
     */
    const askForPermissions = () => {
        logger.logMessage(`Requesting Browser Permission to Origin: '${extensionSettings?.host}'`, LogLevel.INFO)

        if (extensionSettings.host !== undefined) {
            logger.logMessage(`Requesting permission to Origin ${extensionSettings.host}`, LogLevel.DEBUG)
            _browser.permissions.request(
                {
                    origins: [extensionSettings.host],
                },
                (granted: boolean) => {
                    setHasPermission(granted)
                }
            )
        }
    }

    function hasOriginPermission() {
        if (extensionSettings.host !== undefined && isHttpUriValidator(extensionSettings.host)) {
            chrome.permissions.contains(
                {
                    origins: [extensionSettings.host],
                },
                (result: boolean) => {
                    if (chrome.runtime.lastError) {
                        logger.logMessage('Error in hasOriginPermission', LogLevel.WARN)
                    }
                    if (result) {
                        setHasPermission(true)
                    } else {
                        setHasPermission(false)
                    }
                }
            )
        }
    }

    /**
     * Field onChange Handlers
     */
    function handleIqHostChange(e) {
        const newExtensionSettings = extensionSettings !== undefined ? extensionSettings : DEFAULT_EXTENSION_SETTINGS
        const host = e.target.value
        newExtensionSettings.host = (host as string).endsWith('/') ? host : `${host}/`
        setExtensionConfig(newExtensionSettings)
        hasOriginPermission()
    }

    function handleIqTokenChange(e) {
        const newExtensionSettings = extensionSettings as ExtensionConfiguration
        newExtensionSettings.token = e as string
        setExtensionConfig(newExtensionSettings)
    }

    function handleIqUserChange(e) {
        const newExtensionSettings = extensionSettings as ExtensionConfiguration
        newExtensionSettings.user = e as string
        setExtensionConfig(newExtensionSettings)
    }

    function handleIqApplicationChange(e) {
        const newExtensionSettings = extensionSettings as ExtensionConfiguration
        const [iqApplicationInternalId, iqApplicationPublidId] = (e.target.value as string).split('|')
        newExtensionSettings.iqApplicationInternalId = iqApplicationInternalId
        newExtensionSettings.iqApplicationPublidId = iqApplicationPublidId
        setExtensionConfig(newExtensionSettings)
    }

    function handleLoginCheck() {
        _browser.runtime
            .sendMessage({
                type: MESSAGE_REQUEST_TYPE.GET_APPLICATIONS,
            })
            .catch((err) => {
                logger.logMessage(`Error caught calling GET_APPLICATIONS`, LogLevel.DEBUG, err)
            })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then((response: any) => {
                // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
                if (_browser.runtime.lastError) {
                    logger.logMessage('Error handleLoginCheck', LogLevel.ERROR)
                    return
                }
                logger.logMessage(`Response to GET_APPLICATIONS: ${response}`, LogLevel.DEBUG)
                if (response !== undefined) {
                    logger.logMessage(`Processing response to message GET_APPLICATIONS: ${response}`, LogLevel.DEBUG)
                    const msgResponse = response as MessageResponse
                    if (
                        msgResponse.status == MESSAGE_RESPONSE_STATUS.SUCCESS &&
                        msgResponse.data &&
                        'applications' in msgResponse.data
                    ) {
                        setIqAuthenticated(true)
                        setiqServerApplicationList(msgResponse.data.applications as Array<ApiApplicationDTO>)
                    } else {
                        setIqAuthenticated(false)
                        setiqServerApplicationList([])
                    }
                }
            })
    }

    return (
        <React.Fragment>
            <NxGrid.Row>
                <section className='nx-grid-col nx-grid-col--100'>
                    <p className='nx-p'>
                        <strong>1)</strong> {_browser.i18n.getMessage('OPTIONS_PAGE_SONATYPE_POINT_1')}
                    </p>

                    <div className='nx-form-row'>
                        <NxFormGroup label={`URL`} isRequired>
                            <NxStatefulTextInput
                                value={extensionSettings?.host as string}
                                placeholder='https://your-iq-server-url'
                                validator={nonEmptyValidator}
                                onBlur={handleIqHostChange}
                            />
                        </NxFormGroup>
                        {!hasPermissions && (
                            <button className='nx-btn grant-permissions' onClick={askForPermissions}>
                                {_browser.i18n.getMessage('OPTIONS_PAGE_SONATYPE_BUTTON_GRANT_PERMISSIONS')}
                            </button>
                        )}
                    </div>

                    {hasPermissions && (
                        <div>
                            <p className='nx-p'>
                                <strong>2)</strong> {_browser.i18n.getMessage('OPTIONS_PAGE_SONATYPE_POINT_2')}
                            </p>
                            <div className='nx-form-row'>
                                <NxFormGroup label={_browser.i18n.getMessage('LABEL_USERNAME')} isRequired>
                                    <NxStatefulTextInput
                                        defaultValue={extensionSettings?.user}
                                        validator={nonEmptyValidator}
                                        onChange={handleIqUserChange}
                                    />
                                </NxFormGroup>
                                <NxFormGroup label={_browser.i18n.getMessage('LABEL_PASSWORD')} isRequired>
                                    <NxStatefulTextInput
                                        defaultValue={extensionSettings?.token}
                                        validator={nonEmptyValidator}
                                        type='password'
                                        onChange={handleIqTokenChange}
                                    />
                                </NxFormGroup>
                                <NxButton variant='primary' onClick={handleLoginCheck}>
                                    {_browser.i18n.getMessage('OPTIONS_PAGE_SONATYPE_BUTTON_CONNECT_IQ')}
                                </NxButton>
                            </div>
                        </div>
                    )}
                    {iqAuthenticated === true && iqServerApplicationList.length > 0 && (
                        <React.Fragment>
                            <p className='nx-p'>
                                <strong>3)</strong> {_browser.i18n.getMessage('OPTIONS_PAGE_SONATYPE_POINT_3')}
                                <NxTooltip title={_browser.i18n.getMessage('OPTIONS_PAGE_TOOLTIP_WHY_APPLICATION')}>
                                    <NxFontAwesomeIcon icon={faQuestionCircle as IconDefinition} />
                                </NxTooltip>
                            </p>

                            <NxFormGroup label={_browser.i18n.getMessage('LABEL_SONATYPE_APPLICATION')} isRequired>
                                <NxFormSelect
                                    defaultValue={`${extensionSettings.iqApplicationInternalId}|${extensionSettings.iqApplicationPublidId}`}
                                    onChange={handleIqApplicationChange}
                                    disabled={!iqAuthenticated}>
                                    <option value=''>{_browser.i18n.getMessage('LABEL_SELECT_AN_APPLICATION')}</option>
                                    {iqServerApplicationList.map((app: ApiApplicationDTO) => {
                                        return (
                                            <option key={app.id} value={`${app.id}|${app.publicId}`}>
                                                {app.name}
                                            </option>
                                        )
                                    })}
                                </NxFormSelect>
                            </NxFormGroup>
                        </React.Fragment>
                    )}

                    {iqAuthenticated === true &&
                        extensionSettings.iqApplicationInternalId != undefined &&
                        extensionSettings.iqApplicationPublidId != undefined && (
                            <NxStatefulSuccessAlert>
                                {_browser.i18n.getMessage('OPTIONS_SUCCESS_MESSAGE')}
                            </NxStatefulSuccessAlert>
                        )}
                    {extensionSettings.iqApplicationInternalId === undefined &&
                        extensionSettings.iqApplicationPublidId === undefined &&
                        iqAuthenticated === true && (
                            <NxStatefulInfoAlert>
                                {_browser.i18n.getMessage('OPTIONS_INFO_MESSAGE_CHOOSE_APPLICATION')}
                            </NxStatefulInfoAlert>
                        )}
                    {iqAuthenticated === false && (
                        <NxStatefulErrorAlert>
                            {_browser.i18n.getMessage('OPTIONS_ERROR_MESSAGE_UNAUTHENTICATED')}
                        </NxStatefulErrorAlert>
                    )}
                </section>
            </NxGrid.Row>
        </React.Fragment>
    )
}
