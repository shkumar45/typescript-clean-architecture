import { Test, TestingModule } from '@nestjs/testing';
import { PostRepositoryPort } from '../../../../../../src/core/domain/post/port/persistence/PostRepositoryPort';
import { PostDITokens } from '../../../../../../src/core/domain/post/di/PostDITokens';
import { TypeOrmPostRepositoryAdapter } from '../../../../../../src/infrastructure/adapter/persistence/typeorm/repository/post/TypeOrmPostRepositoryAdapter';
import { v4 } from 'uuid';
import { PostImageRemovedEventHandler } from '../../../../../../src/core/domain/post/handler/PostImageRemovedEventHandler';
import { HandlePostImageRemovedEventService } from '../../../../../../src/core/service/post/handler/HandlePostImageRemovedEventService';
import { MediaRemovedEvent } from '../../../../../../src/core/common/cqers/event/events/media/MediaRemovedEvent';
import { MediaType } from '../../../../../../src/core/common/enums/MediaEnums';

describe('HandlePostImageRemovedEventService', () => {
  let postImageRemovedEventHandler: PostImageRemovedEventHandler;
  let postRepository: PostRepositoryPort;
  
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PostDITokens.PostImageRemovedEventHandler,
          useFactory: (postRepository) => new HandlePostImageRemovedEventService(postRepository),
          inject: [PostDITokens.PostRepository]
        },
        {
          provide: PostDITokens.PostRepository,
          useClass: TypeOrmPostRepositoryAdapter
        },
      ]
    }).compile();
    
    postImageRemovedEventHandler = module.get<PostImageRemovedEventHandler>(PostDITokens.PostImageRemovedEventHandler);
    postRepository               = module.get<PostRepositoryPort>(PostDITokens.PostRepository);
  });
  
  describe('execute', () => {
  
    test('When image media is removed, expect it sets "imageId = null" for all dependent posts', async () => {
      const mediaRemovedEvent: MediaRemovedEvent = MediaRemovedEvent.new(v4(), v4(), MediaType.IMAGE);
    
      jest.spyOn(postRepository, 'updatePosts').mockImplementation(async () => undefined);
      jest.spyOn(postRepository, 'updatePosts').mockClear();
  
      await postImageRemovedEventHandler.handle(mediaRemovedEvent);
  
      const attributes: Record<string, unknown> = jest.spyOn(postRepository, 'updatePosts').mock.calls[0][0];
      const filter: Record<string, unknown> = jest.spyOn(postRepository, 'updatePosts').mock.calls[0][1];
      
      expect(attributes).toEqual({imageId: null});
      expect(filter).toEqual({imageId: mediaRemovedEvent.mediaId});
    });
  
    test('When not image media is removed, expect it does not nothing', async () => {
      const mediaUnknownType: unknown = 'UNKNOWN_TYPE';
      const mediaRemovedEvent: MediaRemovedEvent = MediaRemovedEvent.new(v4(), v4(), mediaUnknownType as MediaType);
    
      jest.spyOn(postRepository, 'updatePosts').mockImplementation(async () => undefined);
      jest.spyOn(postRepository, 'updatePosts').mockClear();
    
      await postImageRemovedEventHandler.handle(mediaRemovedEvent);
      
      expect(jest.spyOn(postRepository, 'updatePosts').mock.calls.length).toBe(0);
    });
  
  });
  
});