import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react'

import {
    mdiClose,
    mdiSend,
    mdiArrowDown,
    mdiPencil,
    mdiThumbUp,
    mdiThumbDown,
    mdiCheck,
    mdiStopCircleOutline,
} from '@mdi/js'
import classNames from 'classnames'
import { useLocation } from 'react-router-dom'
import { Popover } from 'react-text-selection-popover'
import useResizeObserver from 'use-resize-observer'

import {
    Chat,
    ChatUISubmitButtonProps,
    ChatUITextAreaProps,
    EditButtonProps,
    FeedbackButtonsProps,
} from '@sourcegraph/cody-ui/dist/Chat'
import { FileLinkProps } from '@sourcegraph/cody-ui/dist/chat/ContextFiles'
import { CODY_TERMS_MARKDOWN } from '@sourcegraph/cody-ui/dist/terms'
import { Button, Icon, TextArea, Link, Tooltip, Alert, Text, H2 } from '@sourcegraph/wildcard'

import { eventLogger } from '../../../tracking/eventLogger'
import { CodyPageIcon } from '../../chat/CodyPageIcon'
import { isCodyEnabled, isEmailVerificationNeededForCody, isSignInRequiredForCody } from '../../isCodyEnabled'
import { useCodySidebar } from '../../sidebar/Provider'
import { CodyChatStore } from '../../useCodyChat'
import { CodyRecipesWidget } from '../../widgets/CodyRecipesWidget'
import { ScopeSelector } from '../ScopeSelector'

import styles from './ChatUi.module.scss'

export const SCROLL_THRESHOLD = 100

const onFeedbackSubmit = (feedback: string): void => eventLogger.log(`web:cody:feedbackSubmit:${feedback}`)

interface IChatUIProps {
    codyChatStore: CodyChatStore
    isSourcegraphApp?: boolean
}

export const ChatUI: React.FC<IChatUIProps> = ({ codyChatStore, isSourcegraphApp }): JSX.Element => {
    const {
        submitMessage,
        editMessage,
        messageInProgress,
        chatMessages,
        transcript,
        transcriptHistory,
        loaded,
        scope,
        setScope,
        toggleIncludeInferredRepository,
        toggleIncludeInferredFile,
        abortMessageInProgress,
        fetchRepositoryNames,
    } = codyChatStore

    const [formInput, setFormInput] = useState('')
    const [inputHistory, setInputHistory] = useState<string[] | []>(() =>
        transcriptHistory
            .flatMap(entry => entry.interactions)
            .sort((entryA, entryB) => +new Date(entryA.timestamp) - +new Date(entryB.timestamp))
            .filter(interaction => interaction.humanMessage.displayText !== undefined)
            .map(interaction => interaction.humanMessage.displayText!)
    )
    const [messageBeingEdited, setMessageBeingEdited] = useState<boolean>(false)

    useEffect(() => {
        setMessageBeingEdited(false)
    }, [transcript?.id])

    const onSubmit = useCallback((text: string) => submitMessage(text), [submitMessage])
    const onEdit = useCallback((text: string) => editMessage(text), [editMessage])

    const scopeSelectorProps = useMemo(
        () => ({
            scope,
            setScope,
            toggleIncludeInferredRepository,
            toggleIncludeInferredFile,
            fetchRepositoryNames,
            isSourcegraphApp,
        }),
        [
            scope,
            setScope,
            toggleIncludeInferredRepository,
            toggleIncludeInferredFile,
            fetchRepositoryNames,
            isSourcegraphApp,
        ]
    )

    if (!loaded) {
        return <></>
    }

    const RecipeWidgetWrapperWithProps = useMemo(
        () => (props: { targetRef: any; children: any }) =>
            <RecipeWidgetWrapper {...props} codyChatStore={codyChatStore} />,
        [codyChatStore]
    )
    return (
        <>
            <Chat
                key={transcript?.id}
                messageInProgress={messageInProgress}
                messageBeingEdited={messageBeingEdited}
                setMessageBeingEdited={setMessageBeingEdited}
                transcript={chatMessages}
                formInput={formInput}
                setFormInput={setFormInput}
                inputHistory={inputHistory}
                setInputHistory={setInputHistory}
                onSubmit={onSubmit}
                submitButtonComponent={SubmitButton}
                fileLinkComponent={isSourcegraphApp ? AppFileLink : FileLink}
                className={styles.container}
                afterMarkdown={transcriptHistory.length > 1 ? '' : CODY_TERMS_MARKDOWN}
                transcriptItemClassName={styles.transcriptItem}
                humanTranscriptItemClassName={styles.humanTranscriptItem}
                transcriptItemParticipantClassName="text-muted"
                inputRowClassName={styles.inputRow}
                chatInputClassName={styles.chatInput}
                EditButtonContainer={EditButton}
                editButtonOnSubmit={onEdit}
                textAreaComponent={AutoResizableTextArea}
                codeBlocksCopyButtonClassName={styles.codeBlocksCopyButton}
                transcriptActionClassName={styles.transcriptAction}
                FeedbackButtonsContainer={FeedbackButtons}
                feedbackButtonsOnSubmit={onFeedbackSubmit}
                needsEmailVerification={isEmailVerificationNeededForCody()}
                needsEmailVerificationNotice={NeedsEmailVerificationNotice}
                codyNotEnabledNotice={CodyNotEnabledNotice}
                contextStatusComponent={ScopeSelector}
                contextStatusComponentProps={scopeSelectorProps}
                abortMessageInProgressComponent={AbortMessageInProgress}
                onAbortMessageInProgress={abortMessageInProgress}
                isCodyEnabled={isCodyEnabled()}
                RecipeWidgetWrapper={RecipeWidgetWrapper}
            />
        </>
    )
}

// TODO: fix the types
interface RecipeWidgetWrapperProps {
    targetRef: any
    children: any
    codyChatStore: any
    fileName?: string
    repoName?: string
    revision?: string
}

// TODO: move the component to a separete file inside cody/components
const RecipeWidgetWrapper: React.FunctionComponent<RecipeWidgetWrapperProps> = React.memo(
    function CodyRecipeWidgetWrapper({ targetRef, children, codyChatStore }) {
        const [show, setShow] = useState(false)

        return (
            <>
                {children}

                <Popover
                    target={targetRef.current}
                    render={({ clientRect, isCollapsed, textContent }) => {
                        // TODO: figure out if we can use useEffect here and if so, then handle linter issues
                        useEffect(() => {
                            setShow(!isCollapsed)
                        }, [isCollapsed, setShow])

                        console.log(clientRect, textContent, targetRef.current?.innerText)

                        if (!clientRect || isCollapsed || !targetRef || !show) {
                            return null
                        }

                        // TODO: pass editor and codyChatStore to the widget
                        return (
                            <CodyRecipesWidget
                                codyChatStore={codyChatStore}
                                editor={
                                    null /* TODO: create an editor implementation using the textContent & targetRef.current?.innerText*/
                                }
                            />
                        )
                    }}
                />
            </>
        )
    }
)

interface IAbortMessageInProgressProps {
    onAbortMessageInProgress: () => void
}

const AbortMessageInProgress: React.FunctionComponent<IAbortMessageInProgressProps> = React.memo(
    function AbortMessageInProgressButton({ onAbortMessageInProgress }) {
        return (
            <div className="d-flex justify-content-center w-100 mb-1">
                <Button onClick={onAbortMessageInProgress} variant="secondary" outline={false} size="sm">
                    <Icon aria-label="Abort" svgPath={mdiStopCircleOutline} /> Stop generating
                </Button>
            </div>
        )
    }
)

export const ScrollDownButton = React.memo(function ScrollDownButtonContent({
    onClick,
}: {
    onClick: () => void
}): JSX.Element {
    return (
        <div className={styles.scrollButtonWrapper}>
            <Button className={styles.scrollButton} onClick={onClick}>
                <Icon aria-label="Scroll down" svgPath={mdiArrowDown} />
            </Button>
        </div>
    )
})

export const EditButton: React.FunctionComponent<EditButtonProps> = React.memo(function EditButtonContent({
    className,
    messageBeingEdited,
    setMessageBeingEdited,
}) {
    return (
        <div className={className}>
            <button
                className={classNames(className, styles.editButton)}
                type="button"
                onClick={() => setMessageBeingEdited(!messageBeingEdited)}
            >
                {messageBeingEdited ? (
                    <Icon aria-label="Close" svgPath={mdiClose} />
                ) : (
                    <Icon aria-label="Edit" svgPath={mdiPencil} />
                )}
            </button>
        </div>
    )
})

const FeedbackButtons: React.FunctionComponent<FeedbackButtonsProps> = React.memo(function FeedbackButtonsContent({
    feedbackButtonsOnSubmit,
}) {
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

    const onFeedbackBtnSubmit = useCallback(
        (text: string) => {
            feedbackButtonsOnSubmit(text)
            setFeedbackSubmitted(true)
        },
        [feedbackButtonsOnSubmit]
    )

    return (
        <div className={classNames('d-flex', styles.feedbackButtonsWrapper)}>
            {feedbackSubmitted ? (
                <Button title="Feedback submitted." disabled={true} className="ml-1 p-1">
                    <Icon aria-label="Feedback submitted" svgPath={mdiCheck} />
                </Button>
            ) : (
                <>
                    <Button
                        title="Thumbs up"
                        className="ml-1 p-1"
                        type="button"
                        onClick={() => onFeedbackBtnSubmit('positive')}
                    >
                        <Icon aria-label="Thumbs up" svgPath={mdiThumbUp} />
                    </Button>
                    <Button
                        title="Thumbs down"
                        className="ml-1 p-1"
                        type="button"
                        onClick={() => onFeedbackBtnSubmit('negative')}
                    >
                        <Icon aria-label="Thumbs down" svgPath={mdiThumbDown} />
                    </Button>
                </>
            )}
        </div>
    )
})

export const SubmitButton: React.FunctionComponent<ChatUISubmitButtonProps> = React.memo(function SubmitButtonContent({
    className,
    disabled,
    onClick,
}) {
    return (
        <button
            className={classNames(className, styles.submitButton)}
            type="submit"
            disabled={disabled}
            onClick={onClick}
        >
            <Icon aria-label="Submit" svgPath={mdiSend} />
        </button>
    )
})

export const FileLink: React.FunctionComponent<FileLinkProps> = React.memo(function FileLinkContent({
    path,
    repoName,
    revision,
}) {
    return repoName ? (
        <Tooltip content={`${repoName}/-/blob/${path}`}>
            <Link to={`/${repoName}${revision ? `@${revision}` : ''}/-/blob/${path}`}>{path}</Link>
        </Tooltip>
    ) : (
        <>{path}</>
    )
})

/**
 * Since App doesn't support search UI we don't user link to the blob UI as we do
 * in the standard FileLink component, instead at the moment we render just a plain text
 * see https://github.com/sourcegraph/sourcegraph/issues/53776 for more details.
 */
export const AppFileLink: React.FunctionComponent<FileLinkProps> = React.memo(function AppFileLink({ path }) {
    return <>{path}</>
})

interface AutoResizableTextAreaProps extends ChatUITextAreaProps {}

export const AutoResizableTextArea: React.FC<AutoResizableTextAreaProps> = React.memo(
    function AutoResizableTextAreaContent({ value, onInput, onKeyDown, className, disabled = false }) {
        const { inputNeedsFocus, setFocusProvided } = useCodySidebar() || {
            inputNeedsFocus: false,
            setFocusProvided: () => null,
        }
        const textAreaRef = useRef<HTMLTextAreaElement>(null)
        const { width = 0 } = useResizeObserver({ ref: textAreaRef })

        const adjustTextAreaHeight = useCallback((): void => {
            if (textAreaRef.current) {
                textAreaRef.current.style.height = '0px'
                const scrollHeight = textAreaRef.current.scrollHeight
                textAreaRef.current.style.height = `${scrollHeight}px`

                // Hide scroll if the textArea isn't overflowing.
                textAreaRef.current.style.overflowY = scrollHeight < 200 ? 'hidden' : 'auto'
            }
        }, [])

        const handleChange = (): void => {
            adjustTextAreaHeight()
        }

        useEffect(() => {
            if (inputNeedsFocus && textAreaRef.current) {
                textAreaRef.current.focus()
                setFocusProvided()
            }
        }, [inputNeedsFocus, setFocusProvided])

        useEffect(() => {
            adjustTextAreaHeight()
        }, [adjustTextAreaHeight, value, width])

        const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>): void => {
            if (onKeyDown) {
                onKeyDown(event, textAreaRef.current?.selectionStart ?? null)
            }
        }

        return (
            <Tooltip
                content={
                    isSignInRequiredForCody()
                        ? 'Sign in to get access to Cody.'
                        : isEmailVerificationNeededForCody()
                        ? 'Verify your email to use Cody.'
                        : ''
                }
            >
                <TextArea
                    ref={textAreaRef}
                    className={className}
                    value={isSignInRequiredForCody() ? 'Sign in to get access to use Cody' : value}
                    onChange={handleChange}
                    rows={1}
                    autoFocus={false}
                    required={true}
                    onKeyDown={handleKeyDown}
                    onInput={onInput}
                    disabled={disabled}
                />
            </Tooltip>
        )
    }
)

const NeedsEmailVerificationNotice: React.FunctionComponent = React.memo(
    function NeedsEmailVerificationNoticeContent() {
        return (
            <div className="p-3">
                <H2 className={classNames('d-flex gap-1 align-items-center mb-3', styles.codyMessageHeader)}>
                    <CodyPageIcon /> Cody
                </H2>
                <Alert variant="warning">
                    <Text className="mb-0">Verify email</Text>
                    <Text className="mb-0">
                        Using Cody requires a verified email.{' '}
                        <Link to={`${window.context.currentUser?.settingsURL}/emails`} target="_blank" rel="noreferrer">
                            Resend email verification
                        </Link>
                        .
                    </Text>
                </Alert>
            </div>
        )
    }
)

const CodyNotEnabledNotice: React.FunctionComponent = React.memo(function CodyNotEnabledNoticeContent() {
    const location = useLocation()

    return (
        <div className={classNames('p-3', styles.notEnabledBlock)}>
            <H2 className={classNames('d-flex gap-1 align-items-center mb-3', styles.codyMessageHeader)}>
                <CodyPageIcon /> Cody
            </H2>
            <div className="d-flex align-items-start">
                <CodyNotEnabledIcon className="flex-shrink-0" />
                <Text className="ml-2">
                    {isSignInRequiredForCody() ? (
                        <>
                            <Link to={`/sign-in?returnTo=${location.pathname}`}>Sign in</Link> to get access to Cody.
                            You can learn more about Cody{' '}
                            <Link to="https://about.sourcegraph.com/cody?utm_source=server">here</Link>.
                        </>
                    ) : (
                        <>
                            Cody isn't available on this instance, but you can learn more about Cody{' '}
                            <Link to="https://about.sourcegraph.com/cody?utm_source=server">here</Link>.
                        </>
                    )}
                </Text>
            </div>
        </div>
    )
})

const CodyNotEnabledIcon: React.FunctionComponent<{ className?: string }> = ({ className }) => (
    <svg
        width="36"
        height="43"
        viewBox="0 0 36 43"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <rect y="4" width="36" height="35" rx="4.125" fill="#E8D1FF" />
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M21.368 15.2742C22.1732 15.2742 22.826 15.9206 22.826 16.7179V19.2844C22.826 20.0818 22.1732 20.7281 21.368 20.7281C20.5628 20.7281 19.91 20.0818 19.91 19.2844V16.7179C19.91 15.9206 20.5628 15.2742 21.368 15.2742Z"
            fill="#A305E1"
        />
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12.1339 18.6427C12.1339 17.8454 12.7866 17.199 13.5919 17.199H16.1838C16.989 17.199 17.6418 17.8454 17.6418 18.6427C17.6418 19.4401 16.989 20.0864 16.1838 20.0864H13.5919C12.7866 20.0864 12.1339 19.4401 12.1339 18.6427Z"
            fill="#A305E1"
        />
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M24.8523 22.8456C25.3712 23.3338 25.3923 24.146 24.8993 24.6599L24.4406 25.138C20.851 28.8795 14.7994 28.7863 11.3291 24.9361C10.8525 24.4073 10.899 23.5961 11.433 23.1241C11.967 22.6522 12.7863 22.6983 13.2629 23.2271C15.724 25.9576 20.0157 26.0237 22.5614 23.3703L23.0201 22.8922C23.5131 22.3783 24.3334 22.3575 24.8523 22.8456Z"
            fill="#A305E1"
        />
    </svg>
)
