import { ActivityPubActivity, ActivityPubObject } from '@/server/activitypub/model/base';

class CreateActivity extends ActivityPubActivity {

  constructor( actorUrl: string, object: ActivityPubObject ) {
    super(actorUrl);

    this.type = 'Create';
    this.object = object;
    this.id = object.id + '/create';
  }

  static fromObject( json: Record<string, any> ): CreateActivity {
    let object = json.object;
    let actor = json.actor;
    let activity = new CreateActivity(actor, object);
    activity.id = json.id;
    activity.to = json.to;
    activity.cc = json.cc;
    return activity;
  }
}

export default CreateActivity;
