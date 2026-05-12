import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, AbilityClass, ExtractSubjectType, InferSubjects } from '@casl/ability';
import { UserAccount, AccountType } from '../entities/user-account.entity';

export enum Action {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}

export type Subjects = InferSubjects<typeof UserAccount> | 'all';

export type AppAbility = Ability<[Action, Subjects]>;

@Injectable()
export class AbilitiesFactory {
  createForUser(user: { accountType: AccountType; userId: string }) {
    const { can, cannot, build } = new AbilityBuilder<Ability<[Action, Subjects]>>(
      Ability as AbilityClass<AppAbility>,
    );

    // Customer abilities
    if (user.accountType === AccountType.CUSTOMER) {
      can(Action.Read, UserAccount, { id: user.userId });
      can(Action.Update, UserAccount, { id: user.userId });
      can(Action.Delete, UserAccount, { id: user.userId });
    }

    // Welper abilities
    if (user.accountType === AccountType.WELPER) {
      can(Action.Read, UserAccount);
      can(Action.Read, UserAccount, { id: user.userId });
      can(Action.Update, UserAccount, { id: user.userId });
      can(Action.Delete, UserAccount, { id: user.userId });
    }

    // Guardian abilities
    if (user.accountType === AccountType.GUARDIAN) {
      can(Action.Read, UserAccount, { id: user.userId });
      can(Action.Update, UserAccount, { id: user.userId });
    }

    if (user.accountType === AccountType.ADMIN) {
      can(Action.Manage, 'all');
    }

    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}

