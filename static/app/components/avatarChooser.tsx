import * as React from 'react';
import styled from '@emotion/styled';

import {addErrorMessage, addSuccessMessage} from 'sentry/actionCreators/indicator';
import {Client} from 'sentry/api';
import Avatar from 'sentry/components/avatar';
import AvatarCropper from 'sentry/components/avatarCropper';
import Button from 'sentry/components/button';
import ExternalLink from 'sentry/components/links/externalLink';
import LoadingError from 'sentry/components/loadingError';
import LoadingIndicator from 'sentry/components/loadingIndicator';
import {Panel, PanelBody, PanelHeader} from 'sentry/components/panels';
import Well from 'sentry/components/well';
import {t} from 'sentry/locale';
import {AvatarUser, Organization, Team} from 'sentry/types';
import withApi from 'sentry/utils/withApi';
import RadioGroup from 'sentry/views/settings/components/forms/controls/radioGroup';

type Model = Pick<AvatarUser, 'avatar'>;
type AvatarType = Required<Model>['avatar']['avatarType'];
type AvatarChooserType = 'user' | 'team' | 'organization';

type DefaultProps = {
  onSave: (model: Model) => void;
  allowGravatar?: boolean;
  allowLetter?: boolean;
  allowUpload?: boolean;
  type?: AvatarChooserType;
};

type Props = {
  api: Client;
  endpoint: string;
  model: Model;
  disabled?: boolean;
  savedDataUrl?: string;
  isUser?: boolean;
} & DefaultProps;

type State = {
  model: Model;
  hasError: boolean;
  savedDataUrl?: string | null;
  dataUrl?: string | null;
};

class AvatarChooser extends React.Component<Props, State> {
  static defaultProps: DefaultProps = {
    allowGravatar: true,
    allowLetter: true,
    allowUpload: true,
    type: 'user',
    onSave: () => {},
  };

  state: State = {
    model: this.props.model,
    savedDataUrl: null,
    dataUrl: null,
    hasError: false,
  };

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    // Update local state if defined in props
    if (typeof nextProps.model !== 'undefined') {
      this.setState({model: nextProps.model});
    }
  }

  updateState(model: Model) {
    this.setState({model});
  }

  handleError(msg: string) {
    addErrorMessage(msg);
  }

  handleSuccess(model: Model) {
    const {onSave} = this.props;
    this.setState({model});
    onSave(model);
    addSuccessMessage(t('Successfully saved avatar preferences'));
  }

  handleSaveSettings = (ev: React.MouseEvent) => {
    const {endpoint, api} = this.props;
    const {model, dataUrl} = this.state;
    ev.preventDefault();
    let data = {};
    const avatarType = model && model.avatar ? model.avatar.avatarType : undefined;
    const avatarPhoto = dataUrl ? dataUrl.split(',')[1] : undefined;

    data = {
      avatar_photo: avatarPhoto,
      avatar_type: avatarType,
    };

    api.request(endpoint, {
      method: 'PUT',
      data,
      success: resp => {
        this.setState({savedDataUrl: this.state.dataUrl});
        this.handleSuccess(resp);
      },
      error: this.handleError.bind(this, 'There was an error saving your preferences.'),
    });
  };

  handleChange = (id: AvatarType) =>
    this.updateState({
      ...this.state.model,
      avatar: {avatarUuid: this.state.model.avatar?.avatarUuid ?? '', avatarType: id},
    });

  render() {
    const {
      allowGravatar,
      allowUpload,
      allowLetter,
      savedDataUrl,
      type,
      isUser,
      disabled,
    } = this.props;
    const {hasError, model} = this.state;

    if (hasError) {
      return <LoadingError />;
    }
    if (!model) {
      return <LoadingIndicator />;
    }

    const avatarType = model.avatar?.avatarType ?? 'letter_avatar';
    const isLetter = avatarType === 'letter_avatar';

    const isTeam = type === 'team';
    const isOrganization = type === 'organization';
    const choices: [AvatarType, string][] = [];

    if (allowLetter) {
      choices.push(['letter_avatar', t('Use initials')]);
    }
    if (allowUpload) {
      choices.push(['upload', t('Upload an image')]);
    }
    if (allowGravatar) {
      choices.push(['gravatar', t('Use Gravatar')]);
    }

    return (
      <Panel>
        <PanelHeader>{t('Avatar')}</PanelHeader>
        <PanelBody>
          <AvatarForm>
            <AvatarGroup inline={isLetter}>
              <RadioGroup
                style={{flex: 1}}
                choices={choices}
                value={avatarType}
                label={t('Avatar Type')}
                onChange={this.handleChange}
                disabled={disabled}
              />
              {isLetter && (
                <Avatar
                  gravatar={false}
                  style={{width: 90, height: 90}}
                  user={isUser ? (model as AvatarUser) : undefined}
                  organization={isOrganization ? (model as Organization) : undefined}
                  team={isTeam ? (model as Team) : undefined}
                />
              )}
            </AvatarGroup>

            <AvatarUploadSection>
              {allowGravatar && avatarType === 'gravatar' && (
                <Well>
                  {t('Gravatars are managed through ')}
                  <ExternalLink href="http://gravatar.com">Gravatar.com</ExternalLink>
                </Well>
              )}

              {model.avatar && avatarType === 'upload' && (
                <AvatarCropper
                  {...this.props}
                  type={type!}
                  model={model}
                  savedDataUrl={savedDataUrl}
                  updateDataUrlState={dataState => this.setState(dataState)}
                />
              )}
              <AvatarSubmit className="form-actions">
                <Button
                  type="button"
                  priority="primary"
                  onClick={this.handleSaveSettings}
                  disabled={disabled}
                >
                  {t('Save Avatar')}
                </Button>
              </AvatarSubmit>
            </AvatarUploadSection>
          </AvatarForm>
        </PanelBody>
      </Panel>
    );
  }
}

const AvatarGroup = styled('div')<{inline: boolean}>`
  display: flex;
  flex-direction: ${p => (p.inline ? 'row' : 'column')};
`;

const AvatarForm = styled('div')`
  line-height: 1.5em;
  padding: 1em 1.25em;
`;

const AvatarSubmit = styled('fieldset')`
  display: flex;
  justify-content: flex-end;
  margin-top: 1em;
`;

const AvatarUploadSection = styled('div')`
  margin-top: 1em;
`;

export default withApi(AvatarChooser);
